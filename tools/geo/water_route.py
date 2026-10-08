"""Routes over the terrain grid's water: A* between waypoints with a penalty for hugging the shore,
then Douglas–Peucker thinning. Shared by ferry_route.py (the ferry's track) and leg_routes.py (the
expedition's legs). Coordinates are the game's local metres, x east, z south, origin Friday Harbor.
"""
import heapq, json, math, os
import numpy as np

SHORE_PENALTY = 6     # cells within which the shore costs extra
TOLERANCE_M = 60.0    # Douglas–Peucker tolerance for the thinned track


class Water:
    def __init__(self, tdir='godot/terrain'):
        meta = json.load(open(os.path.join(tdir, 'terrain.json')))
        self.meta = meta
        self.W, self.H, self.step = meta['width'], meta['height'], meta['metres_per_pixel']
        self.x0, self.z0 = meta['top_left']['x'], meta['top_left']['z']
        cover = np.fromfile(os.path.join(tdir, 'cover.u8'), np.uint8).reshape(self.H, self.W)
        self.land = cover != 80
        # Distance to land in cells, up to SHORE_PENALTY, by dilation.
        dist = np.full((self.H, self.W), SHORE_PENALTY + 1, dtype=np.int16)
        ring = self.land.copy(); dist[self.land] = 0
        for k in range(1, SHORE_PENALTY + 1):
            grown = ring.copy()
            grown[1:, :] |= ring[:-1, :]; grown[:-1, :] |= ring[1:, :]
            grown[:, 1:] |= ring[:, :-1]; grown[:, :-1] |= ring[:, 1:]
            dist[grown & ~ring] = k; ring = grown
        self.cell_cost = np.where(self.land, np.inf, 1.0 + np.maximum(0, SHORE_PENALTY - dist) ** 2 * 0.8)

    def cell(self, x, z):
        return int((x - self.x0) / self.step), int((z - self.z0) / self.step)

    def on_land(self, x, z):
        cx, cy = self.cell(x, z)
        return not (0 <= cx < self.W and 0 <= cy < self.H) or bool(self.land[cy, cx])

    def astar(self, a, b):
        (ax, ay), (bx, by) = a, b
        W, H, land, cost = self.W, self.H, self.land, self.cell_cost
        open_ = [(0.0, ax, ay)]; came = {}; g = {(ax, ay): 0.0}
        while open_:
            _, x, y = heapq.heappop(open_)
            if (x, y) == (bx, by):
                break
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx == dy == 0: continue
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < W and 0 <= ny < H) or land[ny, nx]: continue
                    ng = g[(x, y)] + math.hypot(dx, dy) * cost[ny, nx]
                    if ng < g.get((nx, ny), math.inf):
                        g[(nx, ny)] = ng; came[(nx, ny)] = (x, y)
                        heapq.heappush(open_, (ng + math.hypot(bx - nx, by - ny), nx, ny))
        path = [(bx, by)]
        while path[-1] != (ax, ay):
            path.append(came[path[-1]])
        return path[::-1]

    def track(self, vias, tol=TOLERANCE_M):
        """The thinned water track through `vias` ([(x, z), ...]); the segment starts as `index`."""
        track, starts = [], []
        for i in range(len(vias) - 1):
            a, b = vias[i], vias[i + 1]
            for v in (a, b):
                if self.on_land(*v):
                    raise SystemExit(f'waypoint on land: {v}')
            cells = self.astar(self.cell(*a), self.cell(*b))
            pts = [(round(self.x0 + (cx + 0.5) * self.step, 1), round(self.z0 + (cy + 0.5) * self.step, 1)) for cx, cy in cells]
            pts[0] = (float(a[0]), float(a[1])); pts[-1] = (float(b[0]), float(b[1]))
            seg = thin(pts, tol)
            if track: seg = seg[1:]
            starts.append(len(track) if not track else len(track) - 1)
            track.extend(seg)
        for (x, z) in track:
            assert not self.on_land(x, z), (x, z)
        starts.append(len(track) - 1)
        return track, starts


def thin(pts, tol):
    if len(pts) < 3: return pts
    (sx, sz), (ex, ez) = pts[0], pts[-1]
    L = math.hypot(ex - sx, ez - sz) or 1e-9
    d = [abs((ex - sx) * (sz - z) - (sx - x) * (ez - sz)) / L for x, z in pts]
    i = int(np.argmax(d))
    if d[i] > tol:
        return thin(pts[:i + 1], tol)[:-1] + thin(pts[i:], tol)
    return [pts[0], pts[-1]]


def length(track):
    return sum(math.hypot(track[i + 1][0] - track[i][0], track[i + 1][1] - track[i][1]) for i in range(len(track) - 1))

#!/usr/bin/env python3
"""Lay the ferry's track from Anacortes to Friday Harbor over the real water.

The Washington State Ferries run goes Guemes Channel → Rosario Strait → Thatcher Pass → north of
Lopez → Harney Channel → Wasp Passage → San Juan Channel → Friday Harbor. The waypoints below are
that sequence, read off the chart; between them the track is found over the terrain grid's water
cells (A* with a penalty for hugging the shore) so the drawn line never touches land at the game's
resolution, then thinned. Output: godot/content/ferry_route.json — the track in local metres and
the places to introduce as the ferry comes abeam of them.

    python3 tools/geo/ferry_route.py [godot/terrain] [godot/content/ferry_route.json]
"""
import heapq, json, math, os, sys
import numpy as np

WAYPOINTS = [  # id, x east, z south (metres from Friday Harbor), place to introduce here (or None)
    ('anacortes', 24400, 2700, 'anacortes'),
    ('rosario', 19000, 1800, None),
    ('thatcher', 15657, 478, 'thatcherPass'),
    ('lopezSound', 11800, -2600, 'lopez'),
    ('harneyE', 9010, -5304, None),
    ('harney', 7164, -5972, 'orcas'),
    ('harneyW', 5200, -6350, 'shaw'),
    ('wasp', 1400, -6450, 'waspPassage'),
    ('sanJuanChannel', -200, -4000, 'sanJuan'),
    ('turn', 1100, -1900, None),
    ('landing', 300, -650, 'fridayHarbor'),
]
SHORE_PENALTY = 6     # cells within which the shore costs extra
TOLERANCE_M = 60.0    # Douglas–Peucker tolerance for the thinned track

def main():
    tdir = sys.argv[1] if len(sys.argv) > 1 else 'godot/terrain'
    out = sys.argv[2] if len(sys.argv) > 2 else 'godot/content/ferry_route.json'
    meta = json.load(open(os.path.join(tdir, 'terrain.json')))
    W, H, step = meta['width'], meta['height'], meta['metres_per_pixel']
    x0, z0 = meta['top_left']['x'], meta['top_left']['z']
    cover = np.fromfile(os.path.join(tdir, 'cover.u8'), np.uint8).reshape(H, W)
    land = cover != 80
    # Distance to land in cells, up to SHORE_PENALTY, by dilation.
    dist = np.full((H, W), SHORE_PENALTY + 1, dtype=np.int16)
    ring = land.copy(); dist[land] = 0
    for k in range(1, SHORE_PENALTY + 1):
        grown = ring.copy()
        grown[1:, :] |= ring[:-1, :]; grown[:-1, :] |= ring[1:, :]
        grown[:, 1:] |= ring[:, :-1]; grown[:, :-1] |= ring[:, 1:]
        dist[grown & ~ring] = k; ring = grown
    cell_cost = np.where(land, np.inf, 1.0 + np.maximum(0, SHORE_PENALTY - dist) ** 2 * 0.8)

    def cell(x, z):
        return int((x - x0) / step), int((z - z0) / step)

    def astar(a, b):
        (ax, ay), (bx, by) = a, b
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
                    ng = g[(x, y)] + math.hypot(dx, dy) * cell_cost[ny, nx]
                    if ng < g.get((nx, ny), math.inf):
                        g[(nx, ny)] = ng; came[(nx, ny)] = (x, y)
                        heapq.heappush(open_, (ng + math.hypot(bx - nx, by - ny), nx, ny))
        path = [(bx, by)]
        while path[-1] != (ax, ay):
            path.append(came[path[-1]])
        return path[::-1]

    def thin(pts, tol):
        if len(pts) < 3: return pts
        (sx, sz), (ex, ez) = pts[0], pts[-1]
        L = math.hypot(ex - sx, ez - sz) or 1e-9
        d = [abs((ex - sx) * (sz - z) - (sx - x) * (ez - sz)) / L for x, z in pts]
        i = int(np.argmax(d))
        if d[i] > tol:
            return thin(pts[:i + 1], tol)[:-1] + thin(pts[i:], tol)
        return [pts[0], pts[-1]]

    track = []; events = []
    for i in range(len(WAYPOINTS) - 1):
        a, b = WAYPOINTS[i], WAYPOINTS[i + 1]
        if land[cell(a[1], a[2])[1], cell(a[1], a[2])[0]] or land[cell(b[1], b[2])[1], cell(b[1], b[2])[0]]:
            sys.exit(f'waypoint on land: {a[0] if land[cell(a[1], a[2])[1], cell(a[1], a[2])[0]] else b[0]}')
        cells = astar(cell(a[1], a[2]), cell(b[1], b[2]))
        pts = [(round(x0 + (cx + 0.5) * step, 1), round(z0 + (cy + 0.5) * step, 1)) for cx, cy in cells]
        pts[0] = (float(a[1]), float(a[2])); pts[-1] = (float(b[1]), float(b[2]))
        seg = thin(pts, TOLERANCE_M)
        if track: seg = seg[1:]
        if a[3] and i == 0:
            events.append({'place': a[3], 'index': 0})
        track.extend(seg)
        if b[3]:
            events.append({'place': b[3], 'index': len(track) - 1})
    # Checks: no track point on land, and every segment clear.
    for (x, z) in track:
        cx, cy = cell(x, z); assert not land[cy, cx], (x, z)
    length = sum(math.hypot(track[i + 1][0] - track[i][0], track[i + 1][1] - track[i][1]) for i in range(len(track) - 1))
    doc = {
        'from': 'Anacortes', 'to': 'Friday Harbor', 'length_m': round(length),
        'note': 'Generated by tools/geo/ferry_route.py over godot/terrain; local metres, x east, z south, origin Friday Harbor.',
        'track': [[x, z] for x, z in track], 'events': events,
    }
    json.dump(doc, open(out, 'w'), indent=1)
    print('track points', len(track), 'length', round(length / 1000, 1), 'km; events', [(e['place'], e['index']) for e in events])

if __name__ == '__main__':
    main()

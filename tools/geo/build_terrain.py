#!/usr/bin/env python3
"""Build the game's terrain from real data.

Heights come from the AWS Terrain Tiles (Mapzen/Tilezen: USGS 3DEP, SRTM and ETOPO bathymetry
merged), land cover from ESA WorldCover 2021 (10 m), both public. The output is a regular grid in
the game's local metres with the origin at Friday Harbor: a 16-bit height PNG (land and seabed),
an 8-bit cover PNG (WorldCover classes), a preview, and a JSON that says how to read them and where
the named places are.

    python3 tools/geo/build_terrain.py <tiles_dir> <out_dir> [--step 24]

Tiles are fetched by tools/geo/fetch-tiles.sh. Reproduction is deterministic.
"""
import json, math, os, sys
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
from rasterio.windows import from_bounds
from PIL import Image

Z = 13
X0, X1, Y0, Y1 = 1291, 1306, 2823, 2835          # tile range fetched (inclusive)
BBOX = (-123.20, 48.45, -122.64, 48.72)             # lon_min, lat_min, lon_max, lat_max: the San Juan core
ORIGIN = (-123.0170, 48.5343)                        # Friday Harbor ferry landing
WORLDCOVER = 'https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N48W123_Map.tif'
M_PER_DEG_LAT = 110574.0
M_PER_DEG_LON = 111320.0 * math.cos(math.radians(ORIGIN[1]))

# Real places, by coordinate. x east, z south in game metres (Godot forward is -z = north).
PLACES = [
    ("anacortes", "Anacortes ferry terminal", 48.5069, -122.6796),
    ("thatcher", "Thatcher Pass", 48.5300, -122.8050),
    ("harney", "Harney Channel", 48.5840, -122.9150),
    ("wasp", "Wasp Passage", 48.5900, -122.9900),
    ("fridayHarbor", "Friday Harbor", 48.5343, -123.0170),
    ("labs", "Friday Harbor Laboratories", 48.5455, -123.0150),
    ("brown", "Brown Island", 48.5378, -123.0045),
    ("turn", "Turn Island", 48.5322, -122.9710),
    ("shaw", "Shaw Island landing", 48.5840, -122.9280),
    ("yellow", "Yellow Island", 48.5890, -123.0330),
    ("jones", "Jones Island north cove", 48.6160, -123.0460),
    ("jonesSouth", "Jones Island south cove", 48.6090, -123.0450),
    ("spieden", "Spieden Island", 48.6500, -123.1200),
    ("orcas", "Orcas Island landing", 48.5980, -122.9440),
    ("lopez", "Lopez Island landing", 48.5700, -122.8830),
    ("sanJuanChannel", "San Juan Channel", 48.5600, -122.9700),
]

def mercator_bounds(x, y, z):
    n = 2 ** z
    def lon(x): return x / n * 360.0 - 180.0
    def lat(y): return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon(x), lat(y + 1), lon(x + 1), lat(y)

def local_xz(lat, lon):
    return ((lon - ORIGIN[0]) * M_PER_DEG_LON, -(lat - ORIGIN[1]) * M_PER_DEG_LAT)

def main():
    tiles_dir, out_dir = sys.argv[1], sys.argv[2]
    step = float(sys.argv[sys.argv.index('--step') + 1]) if '--step' in sys.argv else 24.0
    os.makedirs(out_dir, exist_ok=True)
    # 1. Mosaic the Mercator tiles.
    first = rasterio.open(os.path.join(tiles_dir, f'{X0}_{Y0}.tif'))
    tw, th = first.width, first.height
    crs = first.crs
    nx, ny = X1 - X0 + 1, Y1 - Y0 + 1
    mosaic = np.full((ny * th, nx * tw), np.nan, dtype=np.float32)
    for x in range(X0, X1 + 1):
        for y in range(Y0, Y1 + 1):
            p = os.path.join(tiles_dir, f'{x}_{y}.tif')
            if not os.path.exists(p):
                print('missing tile', x, y); continue
            with rasterio.open(p) as d:
                a = d.read(1).astype(np.float32)
                if d.nodata is not None:
                    a[a == d.nodata] = np.nan
            mosaic[(y - Y0) * th:(y - Y0 + 1) * th, (x - X0) * tw:(x - X0 + 1) * tw] = a
    left, bottom, right, top = first.bounds
    # transform of the whole mosaic in Web Mercator metres
    with rasterio.open(os.path.join(tiles_dir, f'{X1}_{Y1}.tif')) as last:
        l2, b2, r2, t2 = last.bounds
    src_transform = from_origin(left, top, (r2 - left) / mosaic.shape[1], (top - b2) / mosaic.shape[0])
    # 2. Destination grid: EPSG:4326 with pixel sizes that are `step` metres at the origin latitude.
    dlon, dlat = step / M_PER_DEG_LON, step / M_PER_DEG_LAT
    W = int(round((BBOX[2] - BBOX[0]) / dlon)); H = int(round((BBOX[3] - BBOX[1]) / dlat))
    dst_transform = from_origin(BBOX[0], BBOX[3], dlon, dlat)
    height = np.full((H, W), np.nan, dtype=np.float32)
    reproject(mosaic, height, src_transform=src_transform, src_crs=crs, src_nodata=np.nan,
              dst_transform=dst_transform, dst_crs='EPSG:4326', dst_nodata=np.nan, resampling=Resampling.bilinear)
    height = np.clip(np.nan_to_num(height, nan=0.0), -200.0, 1100.0)
    # 3. Land cover from WorldCover, windowed over HTTP, nearest to the same grid.
    cover = np.zeros((H, W), dtype=np.uint8)
    # WorldCover tiles are 3 degrees wide, named by their south-west corner: the bbox straddles
    # W126 (west of 123 W: Friday Harbor's west side, Jones, Spieden) and W123. Blocks are read in
    # 0.1 degree windows with retries, because a dropped range request comes back as silent zeros.
    os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '8'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '1')
    for tile, lon_lo, lon_hi in (('N48W126', -126.0, -123.0), ('N48W123', -123.0, -120.0)):
        lo, hi = max(BBOX[0], lon_lo), min(BBOX[2], lon_hi)
        if hi <= lo:
            continue
        url = WORLDCOVER.replace('N48W123', tile)
        try:
            with rasterio.open('/vsicurl/' + url) as d:
                lon = lo
                while lon < hi - 1e-9:
                    lon2 = min(hi, lon + 0.1)
                    for attempt in range(4):
                        win = from_bounds(lon, BBOX[1], lon2, BBOX[3], d.transform)
                        src = d.read(1, window=win)
                        if (src == 0).mean() < 0.02 or attempt == 3:
                            break
                    part = np.zeros((H, W), dtype=np.uint8)
                    reproject(src, part, src_transform=d.window_transform(win), src_crs=d.crs,
                              dst_transform=dst_transform, dst_crs='EPSG:4326', resampling=Resampling.nearest)
                    cover = np.where(part > 0, part, cover)
                    lon = lon2
        except Exception as e:
            print('land cover tile unavailable', tile, e)
    # The coastline is the height map's: anything the DEM calls sea is sea, whatever the cover says.
    sea = height <= 0.0
    cover[sea] = 80
    land_px = int((~sea).sum())
    # 4. Write: height as 16-bit (h + 200) * 50, cover as classes, a preview for eyes.
    h16 = np.clip((height + 200.0) * 50.0, 0, 65535).astype(np.uint16)
    Image.fromarray(h16).save(os.path.join(out_dir, 'height.png'))
    Image.fromarray(cover, mode='L').save(os.path.join(out_dir, 'cover.png'))
    prev = np.zeros((H, W, 3), dtype=np.uint8)
    depth = np.clip(-height, 0, 120) / 120.0
    prev[sea] = (np.stack([20 + 40 * (1 - depth[sea]), 90 + 80 * (1 - depth[sea]), 110 + 90 * (1 - depth[sea])], -1)).astype(np.uint8)
    shade = np.clip(0.55 + 0.45 * np.gradient(height, axis=1) / 8.0, 0.3, 1.0)
    palette = {10: (46, 92, 52), 20: (96, 128, 70), 30: (124, 150, 80), 40: (170, 160, 100), 50: (150, 140, 130), 60: (160, 150, 130), 90: (90, 130, 110), 95: (70, 110, 90), 100: (110, 150, 100)}
    for cls, rgb in palette.items():
        m = (~sea) & (cover == cls)
        prev[m] = (np.array(rgb)[None, :] * shade[m][:, None]).astype(np.uint8)
    other = (~sea) & (prev.sum(-1) == 0)
    prev[other] = (np.array((150, 140, 110))[None, :] * shade[other][:, None]).astype(np.uint8)
    Image.fromarray(prev).save(os.path.join(out_dir, 'preview.png'))
    places = []
    for pid, name, lat, lon in PLACES:
        x, z = local_xz(lat, lon)
        places.append({"id": pid, "name": name, "lat": lat, "lon": lon, "x": round(x, 1), "z": round(z, 1)})
    ox, oz = local_xz(BBOX[3], BBOX[0])  # top-left pixel's local position
    meta = {
        "origin": {"lat": ORIGIN[1], "lon": ORIGIN[0], "name": "Friday Harbor"},
        "bbox": {"lon_min": BBOX[0], "lat_min": BBOX[1], "lon_max": BBOX[2], "lat_max": BBOX[3]},
        "width": W, "height": H, "metres_per_pixel": step,
        "top_left": {"x": round(ox, 1), "z": round(oz, 1)},
        "height_encoding": {"formula": "metres = value / 50 - 200", "png": "height.png", "bits": 16},
        "cover_classes": {"10": "tree cover", "20": "shrubland", "30": "grassland", "40": "cropland", "50": "built-up", "60": "bare", "80": "water", "90": "wetland", "95": "mangrove", "100": "moss"},
        "sources": [
            {"id": "terrain-tiles", "title": "AWS Terrain Tiles (Mapzen/Tilezen; USGS 3DEP, SRTM, ETOPO1)", "licence": "public domain sources; tiles CC0 by Mapzen", "url": "https://registry.opendata.aws/terrain-tiles/"},
            {"id": "worldcover", "title": "ESA WorldCover 2021 v200", "licence": "CC BY 4.0", "url": "https://esa-worldcover.org/"},
        ],
        "places": places,
        "stats": {"land_pixels": land_px, "max_height_m": float(height.max()), "min_height_m": float(height.min())},
    }
    with open(os.path.join(out_dir, 'terrain.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    unclassified_land = int(((~sea) & (cover == 0)).sum())
    print('unclassified land px', unclassified_land)
    print('wrote', W, 'x', H, 'at', step, 'm/px; land px', land_px, 'max', round(float(height.max()), 1), 'm; min', round(float(height.min()), 1), 'm')

if __name__ == '__main__':
    main()

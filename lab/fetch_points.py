import json, pathlib, time, requests
from points import POINTS

PARAMS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR"
URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
cache = pathlib.Path("lab/cache"); cache.mkdir(parents=True, exist_ok=True)

def fetch(lat, lon):
    for attempt in range(5):
        try:
            r = requests.get(URL, params={"parameters": PARAMS, "community": "AG",
                "latitude": lat, "longitude": lon, "start": 1981, "end": 2025,
                "format": "JSON"}, timeout=120)
            if r.status_code == 200:
                return r.json()
            print(f"  status {r.status_code}, retry {attempt+1}")
        except requests.RequestException as e:
            print(f"  error {type(e).__name__}, retry {attempt+1}")
        time.sleep(2 ** attempt)
    return None

print("-----------------OUTPUT----------------")
ok = fail = 0
for name, lat, lon in POINTS:
    f = cache / f"pt_{name.replace(' ', '_')}.json"
    if f.exists():
        ok += 1; print(f"{name}: cached"); continue
    d = fetch(lat, lon)
    if d is None:
        fail += 1; print(f"{name}: FAILED"); continue
    f.write_text(json.dumps(d)); ok += 1
    c = d["geometry"]["coordinates"]
    print(f"{name}: ok cell {c[1]},{c[0]} elev {c[2]}")
    time.sleep(1)
print(f"done ok={ok} failed={fail} of {len(POINTS)}")

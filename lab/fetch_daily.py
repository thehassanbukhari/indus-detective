import pathlib, time, requests
from points import POINTS
URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
cache = pathlib.Path("lab/cache")
def fetch(lat, lon):
    for attempt in range(5):
        try:
            r = requests.get(URL, params={"parameters": "T2M,T2M_MAX,T2M_MIN", "community": "AG",
                "latitude": lat, "longitude": lon, "start": "19810101", "end": "20251231",
                "format": "JSON"}, timeout=300)
            if r.status_code == 200:
                return r.text
            print(f"  status {r.status_code}, retry {attempt+1}")
        except requests.RequestException as e:
            print(f"  error {type(e).__name__}, retry {attempt+1}")
        time.sleep(2 ** attempt)
    return None
print("-----------------OUTPUT----------------")
ok = fail = 0
for name, lat, lon in POINTS:
    f = cache / f"daily_{name.replace(' ', '_')}.json"
    if f.exists():
        ok += 1; continue
    t = fetch(lat, lon)
    if t is None:
        fail += 1; print(f"{name}: FAILED"); continue
    f.write_text(t); ok += 1
    print(f"{name}: ok")
    time.sleep(1)
print(f"done ok={ok} failed={fail} of {len(POINTS)}")

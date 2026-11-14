import json, pathlib, requests
import numpy as np
import pymannkendall as mk
from scipy.stats import theilslopes

LAT, LON = 34.07, 72.62  # Topi area
PARAMS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"]
URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
cache = pathlib.Path("lab/cache"); cache.mkdir(parents=True, exist_ok=True)
f = cache / f"monthly_{LAT}_{LON}.json"

if f.exists():
    data = json.loads(f.read_text())
else:
    r = requests.get(URL, params={
        "parameters": ",".join(PARAMS), "community": "AG",
        "latitude": LAT, "longitude": LON,
        "start": 1981, "end": 2025, "format": "JSON"}, timeout=120)
    r.raise_for_status()
    data = r.json()
    f.write_text(json.dumps(data))

par = data["properties"]["parameter"]
print("-----------------OUTPUT----------------")
for p in PARAMS:
    ann = {int(k[:4]): v for k, v in par[p].items() if k.endswith("13") and v != -999}
    yrs = np.array(sorted(ann)); y = np.array([ann[a] for a in yrs])
    if p == "PRECTOTCORR":
        y = y * 365.25  # mm/day to mm/year
    s, _, lo, hi = theilslopes(y, yrs, alpha=0.95)
    t = mk.hamed_rao_modification_test(y)
    print(f"{p}: n={len(y)} {yrs[0]}-{yrs[-1]} slope/decade={s*10:.3f} CI95=[{lo*10:.3f},{hi*10:.3f}] p={t.p:.4f} trend={t.trend}")

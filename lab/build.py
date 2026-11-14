import json, pathlib, calendar
import numpy as np
import pymannkendall as mk
from scipy.stats import theilslopes
from points import POINTS

cache = pathlib.Path("lab/cache"); out = pathlib.Path("data/build"); out.mkdir(parents=True, exist_ok=True)
VARS = ["T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"]
SEASONS = {"annual": list(range(1, 13)), "FMA": [2, 3, 4], "JAS": [7, 8, 9], "DJF": [12, 1, 2]}
YEARS = list(range(1981, 2026))

def monthly(par, v):
    d = {}
    for k, x in par[v].items():
        if k[4:] == "13" or x == -999: continue
        d[(int(k[:4]), int(k[4:]))] = x
    return d

def seasonal(m, v, season):
    res = {}
    for y in YEARS:
        vals = []
        for mo in SEASONS[season]:
            yy = y - 1 if (season == "DJF" and mo == 12) else y
            x = m.get((yy, mo))
            if x is None: vals = None; break
            if v == "PRECTOTCORR": x = x * calendar.monthrange(yy, mo)[1]
            vals.append(x)
        if vals: res[y] = sum(vals) if v == "PRECTOTCORR" else sum(vals) / len(vals)
    return res

def trend(ser):
    yrs = np.array(sorted(ser)); y = np.array([ser[a] for a in yrs])
    if len(y) < 30: return None
    s, _, lo, hi = theilslopes(y, yrs, alpha=0.95)
    t = mk.hamed_rao_modification_test(y)
    return dict(slope=s * 10, lo=lo * 10, hi=hi * 10, p=float(t.p), n=int(len(y)))

def bh(ps, q=0.10):
    n = len(ps); order = np.argsort(ps); thr = 0
    for rank, i in enumerate(order, 1):
        if ps[i] <= q * rank / n: thr = rank
    ok = [False] * n
    for rank, i in enumerate(order, 1):
        if rank <= thr: ok[i] = True
    return ok

cells = {}
for name, lat, lon in POINTS:
    d = json.loads((cache / f"pt_{name.replace(' ', '_')}.json").read_text())
    par = d["properties"]["parameter"]
    m = {v: monthly(par, v) for v in VARS}
    key = tuple(sorted(m["T2M"].items())[:36])
    if key in cells:
        cells[key]["aliases"].append(name); continue
    cells[key] = dict(name=name, aliases=[], lat=lat, lon=lon, elev=d["geometry"]["coordinates"][2], m=m, par=par)
cells = list(cells.values())

for c in cells:
    c["series"] = {}; c["trends"] = {}
    for v in VARS:
        for s in SEASONS:
            ser = seasonal(c["m"][v], v, s)
            c["series"][f"{v}|{s}"] = ser
            c["trends"][f"{v}|{s}"] = trend(ser)

print("-----------------OUTPUT----------------")
print(f"points {len(POINTS)} unique cells {len(cells)}")
for v in VARS:
    for s in SEASONS:
        k = f"{v}|{s}"
        idx = [i for i, c in enumerate(cells) if c["trends"][k]]
        ps = [cells[i]["trends"][k]["p"] for i in idx]
        sig = bh(ps)
        for j, i in enumerate(idx): cells[i]["trends"][k]["sig_fdr"] = bool(sig[j])
        sl = np.array([cells[i]["trends"][k]["slope"] for i in idx])
        if s in ("annual", "FMA"):
            print(f"{k}: mean {sl.mean():.3f} median {np.median(sl):.3f} positive {int((sl>0).sum())}/{len(sl)} fdr_sig {sum(sig)}")

t = next(c for c in cells if c["name"] == "Topi")
yr = t["par"]["PRECTOTCORR"]
own = np.mean(list(t["series"]["PRECTOTCORR|annual"].values()))
pw = np.mean([x for k, x in yr.items() if k.endswith("13") and x != -999])
print(f"Topi rain cross check: own annual mean {own:.0f} mm, POWER annual key mean {pw:.3f} mm/day = {pw*365.25:.0f} mm")
print("Topi own annual rain 1981..2025 first5/last5:", [round(t['series']['PRECTOTCORR|annual'][y]) for y in (1981,1982,1983,1984,1985)], [round(t['series']['PRECTOTCORR|annual'][y]) for y in (2021,2022,2023,2024,2025)])
for k in ("T2M|annual", "T2M_MAX|annual", "T2M_MIN|annual", "PRECTOTCORR|annual"):
    r = t["trends"][k]; print(f"Topi {k}: {r['slope']:.3f}/decade [{r['lo']:.3f},{r['hi']:.3f}] p={r['p']:.4f}")

meta = [dict(name=c["name"], aliases=c["aliases"], lat=c["lat"], lon=c["lon"], cell_elev_m=c["elev"], trends=c["trends"]) for c in cells]
(out / "trends.json").write_text(json.dumps(meta, separators=(",", ":")))
ser = {c["name"]: {k: {str(y): round(x, 3) for y, x in v.items()} for k, v in c["series"].items() if k.endswith("|annual")} for c in cells}
(out / "series.json").write_text(json.dumps(ser, separators=(",", ":")))

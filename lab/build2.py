import json, pathlib, calendar, warnings
import numpy as np
import pymannkendall as mk
from points import POINTS
warnings.filterwarnings("ignore")

cache = pathlib.Path("lab/cache"); out = pathlib.Path("data/build"); out.mkdir(parents=True, exist_ok=True)
VARS = ["T2M", "T2M_MAX", "T2M_MIN"]
SEASONS = {"annual": list(range(1, 13)), "FMA": [2, 3, 4], "JAS": [7, 8, 9], "DJF": [12, 1, 2]}
YEARS = list(range(1981, 2026))
rng = np.random.default_rng(42)

def monthly_means(par, v):
    sums, cnt = {}, {}
    for k, x in par[v].items():
        if x == -999: continue
        key = (int(k[:4]), int(k[4:6]))
        sums[key] = sums.get(key, 0) + x; cnt[key] = cnt.get(key, 0) + 1
    return {k: sums[k] / cnt[k] for k in sums if cnt[k] == calendar.monthrange(*k)[1]}

def seasonal(m, season):
    res = {}
    for y in YEARS:
        vals = []
        for mo in SEASONS[season]:
            yy = y - 1 if (season == "DJF" and mo == 12) else y
            if (yy, mo) not in m: vals = None; break
            vals.append(m[(yy, mo)])
        if vals: res[y] = sum(vals) / len(vals)
    return res

def ts_slopes(Y, x):
    i, j = np.triu_indices(len(x), 1)
    return np.median((Y[:, j] - Y[:, i]) / (x[j] - x[i]), axis=1)

def boot_ci(y, x, B=1000, L=5):
    n = len(y)
    s = ts_slopes(y[None, :], x)[0]
    fit = s * x + np.median(y - s * x)
    res = y - fit
    nb = -(-n // L)
    starts = rng.integers(0, n - L + 1, size=(B, nb))
    idx = (starts[:, :, None] + np.arange(L)).reshape(B, -1)[:, :n]
    sb = ts_slopes(fit[None, :] + res[idx], x)
    return s, np.percentile(sb, 2.5), np.percentile(sb, 97.5)

def trend(ser):
    yrs = np.array(sorted(ser)); y = np.array([ser[a] for a in yrs])
    if len(y) < 25: return None
    s, lo, hi = boot_ci(y, yrs.astype(float))
    p = mk.pre_whitening_modification_test(y).p
    return dict(slope=float(s * 10), lo=float(lo * 10), hi=float(hi * 10), p=float(1.0 if np.isnan(p) else p), n=int(len(y)))

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
    d = json.loads((cache / f"daily_{name.replace(' ', '_')}.json").read_text())
    par = d["properties"]["parameter"]
    key = tuple(sorted(par["T2M"].items())[:200])
    if key in cells:
        cells[key]["aliases"].append(name); continue
    cells[key] = dict(name=name, aliases=[], lat=lat, lon=lon, elev=d["geometry"]["coordinates"][2],
                      m={v: monthly_means(par, v) for v in VARS})
cells = list(cells.values())
for c in cells:
    c["series"] = {}; c["trends"] = {}
    for v in VARS:
        for s in SEASONS:
            ser = seasonal(c["m"][v], s)
            c["series"][f"{v}|{s}"] = ser; c["trends"][f"{v}|{s}"] = trend(ser)
            c["trends"][f"{v}|{s}@1998"] = trend({y: x for y, x in ser.items() if y >= 1998})

for v in VARS:
    for s in list(SEASONS) + [x + "@1998" for x in SEASONS]:
        k = f"{v}|{s}"
        idx = [i for i, c in enumerate(cells) if c["trends"][k]]
        sig = bh([cells[i]["trends"][k]["p"] for i in idx])
        for j, i in enumerate(idx):
            t = cells[i]["trends"][k]
            t["sig_fdr"] = bool(sig[j])
            t["sig"] = bool(sig[j] and (t["lo"] > 0 or t["hi"] < 0))

meta = [dict(name=c["name"], aliases=c["aliases"], lat=c["lat"], lon=c["lon"], cell_elev_m=c["elev"], trends=c["trends"]) for c in cells]
(out / "trends.json").write_text(json.dumps(meta, separators=(",", ":")))
ser_out = {c["name"]: {k: {str(y): round(x, 3) for y, x in v.items()} for k, v in c["series"].items()} for c in cells}
(out / "series.json").write_text(json.dumps(ser_out, separators=(",", ":")))

print("-----------------OUTPUT----------------")
print(f"points {len(POINTS)} unique cells {len(cells)}")
PMD = {"T2M": 0.21, "T2M_MAX": 0.20, "T2M_MIN": 0.26}
for v in VARS:
    for s in ("annual", "FMA", "JAS", "DJF"):
        k = f"{v}|{s}"; sl = np.array([c["trends"][k]["slope"] for c in cells])
        print(f"{k}: mean cell slope {sl.mean():.3f} positive {int((sl > 0).sum())}/{len(sl)} fdr_sig {sum(c['trends'][k]['sig_fdr'] for c in cells)}")
print("national mean of cells, annual (PMD press number in brackets):")
yrs = np.array(YEARS, dtype=float); nat = {}
for v in VARS:
    y = np.array([np.mean([c["series"][f"{v}|annual"][a] for c in cells]) for a in YEARS]); nat[v] = y
    s, lo, hi = boot_ci(y, yrs); p = mk.pre_whitening_modification_test(y).p
    print(f"  {v}: {s*10:.3f}/decade CI [{lo*10:.3f},{hi*10:.3f}] p={p:.4f} (PMD {PMD[v]})")
print("step check, national annual: slope 1981 to 1997, slope 1998 to 2025, level before and after")
for v in VARS:
    y = nat[v]; a_, b_ = yrs <= 1997, yrs >= 1998
    print(f"  {v}: {ts_slopes(y[a_][None, :], yrs[a_])[0]*10:.3f}, {ts_slopes(y[b_][None, :], yrs[b_])[0]*10:.3f}, {y[a_].mean():.2f} then {y[b_].mean():.2f}")
t = next(c for c in cells if c["name"] == "Topi")
for k in ("T2M|annual", "T2M_MAX|annual", "T2M_MIN|annual"):
    r = t["trends"][k]; print(f"Topi {k}: {r['slope']:.3f}/decade [{r['lo']:.3f},{r['hi']:.3f}] p={r['p']:.4f}")
R = 200; cover = 0; truth = 0.30
for _ in range(R):
    e = rng.normal(0, 0.5, 45); x = np.zeros(45)
    for i in range(1, 45): x[i] = 0.3 * x[i - 1] + e[i]
    yy = 0.03 * (yrs - 1981) + x
    s, lo, hi = boot_ci(yy, yrs, B=500)
    cover += lo * 10 <= truth <= hi * 10
print(f"synthetic coverage of block bootstrap 95 percent interval (AR1 0.3): {cover / R:.2f}")

import json, pathlib
import numpy as np
from scipy.stats import rankdata

series = json.load(open("data/build/series.json"))
KEYS = ["T2M|annual", "T2M_MAX|annual", "T2M_MIN|annual", "T2M_MAX|FMA", "T2M_MIN|FMA", "T2M_MAX|JAS", "T2M_MIN|JAS"]
YEARS = list(range(1981, 2026))

def pettitt(y, years):
    n = len(y)
    r = rankdata(y)
    k = np.arange(1, n)
    U = 2 * np.cumsum(r)[:-1] - k * (n + 1)
    i = int(np.argmax(np.abs(U)))
    K = abs(U[i]); kk = i + 1
    p = min(1.0, 2.0 * np.exp(-6.0 * K ** 2 / (n ** 3 + n ** 2)))
    return dict(year=int(years[kk]), size=float(np.mean(y[kk:]) - np.mean(y[:kk])), p=float(p))

def run(vals_by_year):
    ys = [y for y in YEARS if y in vals_by_year]
    if len(ys) < 40: return None
    return pettitt(np.array([vals_by_year[y] for y in ys]), ys)

out = {}
names = list(series)
for key in KEYS:
    res = {}
    for nme in names:
        s = series[nme].get(key)
        if not s: continue
        r = run({int(a): b for a, b in s.items()})
        if r: res[nme] = r
    yrs = [v["year"] for v in res.values()]
    sig = [v for v in res.values() if v["p"] < 0.05]
    common = [y for y in YEARS if all(series[n].get(key, {}).get(str(y)) is not None for n in names)]
    nat = run({y: float(np.mean([series[n][key][str(y)] for n in names])) for y in common})
    hist = {}
    for y in yrs: hist[y] = hist.get(y, 0) + 1
    out[key] = dict(
        cells=len(res), sig_cells=len(sig),
        median_year=float(np.median(yrs)), q25=float(np.percentile(yrs, 25)), q75=float(np.percentile(yrs, 75)),
        in_1996_1999=int(sum(1 for y in yrs if 1996 <= y <= 1999)),
        median_size=float(np.median([v["size"] for v in res.values()])),
        national=nat, top_years=sorted(hist.items(), key=lambda a: -a[1])[:4],
    )

rng = np.random.default_rng(7)
def ar1(n, phi, sd):
    e = rng.normal(0, sd, n); x = np.zeros(n)
    for t in range(1, n): x[t] = phi * x[t - 1] + e[t]
    return x
yrs = np.array(YEARS); fp = 0; brk = []
for _ in range(2000):
    if pettitt(ar1(45, 0.3, 0.5), yrs)["p"] < 0.05: fp += 1
    brk.append(pettitt(0.03 * (yrs - 1981) + ar1(45, 0.3, 0.5), yrs)["year"])
out["synthetic"] = dict(false_positive_rate=fp / 2000, linear_trend_0_3_per_decade_median_break_year=float(np.median(brk)),
                        linear_trend_q25_q75=[float(np.percentile(brk, 25)), float(np.percentile(brk, 75))])
pathlib.Path("data/build/breaks.json").write_text(json.dumps(out, indent=1))
for k, v in out.items():
    if k == "synthetic": print(k, v); continue
    print(f"{k}: sig cells {v['sig_cells']}/{v['cells']}, break year median {v['median_year']:.0f} (IQR {v['q25']:.0f} to {v['q75']:.0f}), in 1996 to 1999: {v['in_1996_1999']}, median size {v['median_size']:+.2f} C, national {v['national']['year']} {v['national']['size']:+.2f} C p {v['national']['p']:.4f}, top years {v['top_years']}")

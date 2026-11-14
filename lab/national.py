import json, pathlib
import numpy as np
import pymannkendall as mk
YEARS = list(range(1981, 2026))
rng = np.random.default_rng(42)

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

def record(key, yrs, y):
    sl, lo, hi = boot_ci(y, np.array(yrs, float))
    p = mk.pre_whitening_modification_test(y).p
    out[key] = dict(slope=float(sl * 10), lo=float(lo * 10), hi=float(hi * 10), p=float(1.0 if np.isnan(p) else p), n=len(yrs))
    print(f"{key}: {sl*10:+.3f} [{lo*10:+.3f}, {hi*10:+.3f}] p={out[key]['p']:.3f} n={len(yrs)}")

series = json.loads(pathlib.Path("data/build/series.json").read_text())
out = {}
nat = {}
print(f"cells {len(series)}")
for v in ("T2M", "T2M_MAX", "T2M_MIN"):
    for s in ("annual", "FMA"):
        k = f"{v}|{s}"
        for w in (1981, 1998):
            yrs = [y for y in YEARS if y >= w and all(str(y) in series[n][k] for n in series)]
            y = np.array([np.mean([series[n][k][str(a)] for n in series]) for a in yrs])
            nat[(v, s, w)] = (yrs, y)
            record(k if w == 1981 else f"{k}@1998", yrs, y)
# DTR is the gap: daytime high minus night time low, national mean per year
for s in ("annual", "FMA"):
    for w in (1981, 1998):
        yrs, hi_ = nat[("T2M_MAX", s, w)]
        _, lo_ = nat[("T2M_MIN", s, w)]
        record(f"DTR|{s}" if w == 1981 else f"DTR|{s}@1998", yrs, hi_ - lo_)
pathlib.Path("data/build/national.json").write_text(json.dumps(out, separators=(",", ":")))

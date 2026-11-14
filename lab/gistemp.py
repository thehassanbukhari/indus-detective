import json, pathlib, datetime
import numpy as np
import netCDF4 as nc
import pymannkendall as mk

# NASA GISTEMP v4 (2 degree grid, land and ocean), annual mean anomaly 1981 to 2025, national mean, same trend method as lab/national.py
FILE = "lab/cache/gistemp1200_GHCNv4_ERSSTv5.nc"
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

out = {}
def record(key, yrs, y):
    sl, lo, hi = boot_ci(y, np.array(yrs, float))
    p = mk.pre_whitening_modification_test(y).p
    out[key] = dict(slope=float(sl * 10), lo=float(lo * 10), hi=float(hi * 10), p=float(1.0 if np.isnan(p) else p), n=len(yrs))
    r = out[key]; ex = r["lo"] > 0 or r["hi"] < 0
    v = ("Yes" if r["p"] < 0.05 else "Not conclusive") if ex else "No"
    print(f"{key:18s} {r['slope']:+.2f} ({r['lo']:+.2f} to {r['hi']:+.2f}) p {r['p']:.3f} n {r['n']}  {v}")

# rule: a 2 degree cell is used when it holds at least one of our 38 grid cells (nearest cell centre)
places = json.loads(pathlib.Path("data/build/trends.json").read_text())
d = nc.Dataset(FILE)
lat, lon = d["lat"][:], d["lon"][:]
tv = d["time"]
tm = nc.num2date(tv[:], tv.units, only_use_cftime_datetimes=False)
yrs_t = np.array([t.year for t in tm]); mos_t = np.array([t.month for t in tm])
pairs = sorted({(int(np.argmin(np.abs(lat - c["lat"]))), int(np.argmin(np.abs(lon - c["lon"])))) for c in places})
print(f"our places {len(places)}, GISTEMP 2 degree cells used {len(pairs)}")
print("cell centres (lat, lon):", [(float(lat[i]), float(lon[j])) for i, j in pairs])
v = d["tempanomaly"]
per_cell = []
for i, j in pairs:
    s = np.ma.filled(np.ma.asarray(v[:, i, j]).astype(float), np.nan)
    ann = {}
    for y in YEARS:
        m = yrs_t == y
        if m.sum() == 12 and not np.isnan(s[m]).any():
            ann[y] = float(s[m].mean())
    per_cell.append(ann)
yrs = [y for y in YEARS if all(y in a for a in per_cell)]
y = np.array([np.mean([a[k] for a in per_cell]) for k in yrs])
print(f"years used {yrs[0]} to {yrs[-1]} ({len(yrs)}), last month in file {int(yrs_t[-1])}-{int(mos_t[-1]):02d}")
print("national mean anomaly (K) 1981, 2000, 2025:", round(float(y[0]), 2), round(float(y[yrs.index(2000)]), 2), round(float(y[-1]), 2))
for w in (1981, 1998):
    k = [i for i, a in enumerate(yrs) if a >= w]
    record("T2M|annual" if w == 1981 else "T2M|annual@1998", [yrs[i] for i in k], y[k])
out["meta"] = dict(cells=len(pairs), first_year=yrs[0], last_year=yrs[-1], last_month_in_file=f"{int(yrs_t[-1])}-{int(mos_t[-1]):02d}",
                   file_history=str(d.getncattr("history"))[:160], computed=datetime.date.today().isoformat())
pathlib.Path("data/build/gistemp.json").write_text(json.dumps(out, separators=(",", ":")))
print("written data/build/gistemp.json")

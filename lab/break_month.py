import json, pathlib, calendar
import numpy as np
from points import POINTS

cache = pathlib.Path("lab/cache")
VARS = ["T2M_MIN", "T2M_MAX", "T2M"]

def monthly(par, v):
    s, c = {}, {}
    for k, x in par[v].items():
        if x == -999: continue
        key = (int(k[:4]), int(k[4:6])); s[key] = s.get(key, 0) + x; c[key] = c.get(key, 0) + 1
    return {k: s[k] / c[k] for k in s if c[k] == calendar.monthrange(*k)[1]}

cells = {}
for name, lat, lon in POINTS:
    par = json.loads((cache / f"daily_{name.replace(' ', '_')}.json").read_text())["properties"]["parameter"]
    sig = tuple(list(par["T2M_MIN"].values())[:300])
    if sig not in cells: cells[sig] = {v: monthly(par, v) for v in VARS}
print("unique cells", len(cells))

def anomalies(m):
    clim = {mo: np.mean([x for (y, mm), x in m.items() if mm == mo]) for mo in range(1, 13)}
    return {k: x - clim[k[1]] for k, x in m.items()}

nat, per = {}, {v: [] for v in VARS}
for v in VARS:
    an = [anomalies(c[v]) for c in cells.values()]
    per[v] = an
    keys = set().union(*[set(a) for a in an])
    nat[v] = {k: float(np.mean([a[k] for a in an if k in a])) for k in keys}

def scan(series, y0, y1, w):
    out = []
    for y in range(y0, y1 + 1):
        for m in range(1, 13):
            idx = [(y + (m - 1 + i) // 12, (m - 1 + i) % 12 + 1) for i in range(-w, w)]
            if all(k in series for k in idx):
                out.append((np.mean([series[k] for k in idx[w:]]) - np.mean([series[k] for k in idx[:w]]), y, m))
    return out

print("\nSCAN 1 (national, 36 months before vs 36 after each month, 1996 to 2001). Top 4 months by size of change.")
for v in VARS:
    top = sorted(scan(nat[v], 1996, 2001, 36), key=lambda t: -abs(t[0]))[:4]
    print(v, [f"{y}-{m:02d} {d:+.2f}" for d, y, m in top])

print("\nSCAN 1 per cell, T2M_MIN: best change month of each cell, most common")
cnt = {}
for a in per["T2M_MIN"]:
    s = sorted(scan(a, 1996, 2001, 36), key=lambda t: -abs(t[0]))
    if s: k = f"{s[0][1]}-{s[0][2]:02d}"; cnt[k] = cnt.get(k, 0) + 1
print(sorted(cnt.items(), key=lambda t: -t[1])[:6])

print("\nSCAN 2 (national daytime high, 24 months before vs after, 2004 to 2008). Top 4.")
top = sorted(scan(nat["T2M_MAX"], 2004, 2008, 24), key=lambda t: -abs(t[0]))[:4]
print([f"{y}-{m:02d} {d:+.2f}" for d, y, m in top])
print("Jul to Sep daytime high anomaly by year (national):")
print([f"{y} {np.mean([nat['T2M_MAX'][(y, m)] for m in (7, 8, 9)]):+.2f}" for y in range(2001, 2012) if all((y, m) in nat["T2M_MAX"] for m in (7, 8, 9))])
print("\nReference dates in MERRA-2 docs: ATOVS 1998-07-21, AIRS and Aqua AMSU-A 2002-09-01, GPSRO 2004-07-14, OSTIA SST 2006-04-01, TOVS ended 2006-10-10")

import gzip, pathlib, time, urllib.request
BASE = "https://www.ncei.noaa.gov/pub/data/ghcn/daily/"
ghcn = pathlib.Path("lab/cache/ghcn")
RANGE = {"TMAX": (-30.0, 60.0), "TMIN": (-50.0, 45.0)}


def download(name, dest):
    if dest.exists():
        return True
    for attempt in range(5):
        try:
            with urllib.request.urlopen(BASE + name, timeout=300) as r:
                dest.write_bytes(r.read())
            time.sleep(1)
            return True
        except Exception as e:
            print(f"  {name}: {type(e).__name__}, retry {attempt + 1}")
            time.sleep(2 ** attempt)
    return False


rows = []
for l in (ghcn / "pk_stations.txt").read_text().splitlines():
    sid, name = l[:11], l[41:71].strip()
    if not download(f"by_station/{sid}.csv.gz", ghcn / f"{sid}.csv.gz"):
        print(sid, "download failed"); continue
    days = {"TMAX": {}, "TMIN": {}}
    flagged = {"TMAX": 0, "TMIN": 0}
    with gzip.open(ghcn / f"{sid}.csv.gz", "rt") as fh:
        for line in fh:
            p = line.rstrip("\n").split(",")
            if len(p) < 6 or p[2] not in days:
                continue
            y = int(p[1][:4])
            if y < 1981 or y > 2025:
                continue
            if p[5] != "":
                flagged[p[2]] += 1; continue
            v = int(p[3]) / 10.0
            if RANGE[p[2]][0] <= v <= RANGE[p[2]][1]:
                days[p[2]][p[1]] = v
    res = {}
    for e in ("TMAX", "TMIN"):
        cnt = {}
        for d in days[e]:
            k = (int(d[:4]), int(d[4:6])); cnt[k] = cnt.get(k, 0) + 1
        good = {k for k, c in cnt.items() if c >= 20}
        by = {}
        for (y, m) in good: by.setdefault(y, set()).add(m)
        gy = sorted(y for y, ms in by.items() if len(ms) >= 10)
        base = sum(1 for mo in range(1, 13) if sum(1 for (y, m) in good if m == mo and 1981 <= y <= 2010) >= 10)
        res[e] = (len(days[e]), len(good), len(gy), (gy[0], gy[-1]) if gy else None, base, flagged[e])
    rows.append((min(res["TMAX"][2], res["TMIN"][2]), sid, name, res))
rows.sort(key=lambda r: -r[0])
print("COVERAGE 1981 to 2025. Per element: valid days, months with 20 or more days, years with 10 or more such months, first and last such year, calendar months with 10 or more baseline years (1981 to 2010, need 12), rows dropped by quality flag")
for _, sid, name, res in rows:
    print(f"\n{sid} {name}")
    for e, label in (("TMIN", "night low "), ("TMAX", "daytime high")):
        d, m, y, fl, b, q = res[e]
        print(f"  {label}: days {d}, good months {m}, good years {y} {fl}, baseline months {b} of 12, flagged {q}")

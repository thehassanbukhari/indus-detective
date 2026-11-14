import urllib.request
BASE = "https://www.ncei.noaa.gov/pub/data/ghcn/daily/"
def lines(f):
    with urllib.request.urlopen(BASE + f, timeout=300) as r:
        for b in r: yield b.decode("utf8", "ignore")
names = {}
for l in lines("ghcnd-stations.txt"):
    if l.startswith("PK"): names[l[:11]] = l[41:71].strip()
inv = {}
for l in lines("ghcnd-inventory.txt"):
    if l.startswith("PK"):
        p = l.split(); inv.setdefault(p[0], {})[p[3]] = (int(p[4]), int(p[5]))
rows = []
for i, e in inv.items():
    if "TMAX" in e and "TMIN" in e:
        f = max(e["TMAX"][0], e["TMIN"][0]); t = min(e["TMAX"][1], e["TMIN"][1])
        rows.append((t - f, i, names.get(i, "?"), f, t))
rows.sort(reverse=True)
print("PK stations in inventory:", len(inv), "| with TMAX and TMIN:", len(rows))
for r in rows[:15]: print(r[1], r[2], r[3], "to", r[4])
print("covering 1990 or earlier to 2024 or later:", sum(1 for r in rows if r[3] <= 1990 and r[4] >= 2024))

import csv, datetime, json, pathlib, re, sys
from points import POINTS

cache = pathlib.Path("lab/cache")
folder = pathlib.Path("data/hand_check")
LIMIT = 0.05
VARS = ["T2M", "T2M_MAX", "T2M_MIN"]

rows, bad = [], 0
files = sorted(folder.glob("POWER_Point_Daily_*.csv"))
if not files:
    raise SystemExit("no viewer files found in data/hand_check")
for f in files:
    lines = f.read_text().splitlines()
    m = re.search(r"latitude\s+(-?[\d.]+)\s+longitude\s+(-?[\d.]+)", "\n".join(lines))
    lat, lon = float(m.group(1)), float(m.group(2))
    near = [p for p in POINTS if abs(p[1] - lat) < 0.005 and abs(p[2] - lon) < 0.005]
    if not near:
        raise SystemExit(f"{f.name}: no matching point in lab/points.py")
    name = near[0][0]
    par = json.loads((cache / f"daily_{name.replace(' ', '_')}.json").read_text())["properties"]["parameter"]
    data = list(csv.DictReader(lines[lines.index("-END HEADER-") + 1:]))
    for r in data:
        d = (datetime.date(int(r["YEAR"]), 1, 1) + datetime.timedelta(int(r["DOY"]) - 1))
        key = d.strftime("%Y%m%d")
        for v in VARS:
            viewer, ours = float(r[v]), par[v].get(key)
            diff = None if ours is None else abs(viewer - ours)
            ok = diff is not None and ours != -999 and diff <= LIMIT
            bad += 0 if ok else 1
            rows.append((name, d.isoformat(), v, viewer, ours, diff, ok))

maxdiff = max(r[5] for r in rows if r[5] is not None)
places = sorted({r[0] for r in rows}); dates = sorted({r[1] for r in rows})
passed = bad == 0
print(f"files {len(files)}, places {len(places)} ({', '.join(places)}), dates {len(dates)} ({', '.join(dates)}), values {len(rows)}, mismatches {bad}, max difference {maxdiff:.3f} C, limit {LIMIT} C")
print("RESULT:", "PASSED" if passed else "MISMATCH")
for r in rows:
    if not r[6]: print("  mismatch:", r)

md = ["# Hand check against the NASA POWER Data Access Viewer", "",
      "Question: are the numbers stored in our cache the same as the numbers NASA gives in its own viewer?", "",
      "Method: the viewer at https://power.larc.nasa.gov/data-access-viewer/ with user community Agroclimatology, daily, local solar time (the default), single point. Coordinates were typed in decimal degrees and the map was not clicked, because clicking gives a slightly different point. One request per date, parameters T2M, T2M_MAX and T2M_MIN, CSV download. The unedited files are in data/hand_check. They are compared with the daily values we fetched through the POWER daily API (lab/cache), by lab/hand_check.py.", "",
      f"Result: {len(places)} places, {len(dates)} dates, {len(rows)} values, {bad} mismatches, largest difference {maxdiff:.3f} C, limit {LIMIT} C. Verdict: {'passed' if passed else 'mismatch, see the table'}.", "",
      "What this shows: our stored values equal what NASA serves, so the download is faithful. What it does not show: that the MERRA-2 reanalysis matches real weather. That question is handled by the trust panel and the limits panel.", "",
      "| Place | Date | Variable | Viewer (C) | Ours (C) | Difference | Match |", "| --- | --- | --- | --- | --- | --- | --- |"]
for n, d, v, a, b, df, ok in rows:
    md.append(f"| {n} | {d} | {v} | {a:.2f} | {'missing' if b is None else f'{b:.2f}'} | {'n/a' if df is None else f'{df:.2f}'} | {'yes' if ok else 'NO'} |")
pathlib.Path("docs/HAND_CHECK.md").write_text("\n".join(md) + "\n")
print("wrote docs/HAND_CHECK.md")
sys.exit(0 if passed else 1)

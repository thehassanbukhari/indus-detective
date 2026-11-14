# Hand check against the NASA POWER Data Access Viewer

Question: are the numbers stored in our cache the same as the numbers NASA gives in its own viewer?

Method: the viewer at https://power.larc.nasa.gov/data-access-viewer/ with user community Agroclimatology, daily, local solar time (the default), single point. Coordinates were typed in decimal degrees and the map was not clicked, because clicking gives a slightly different point. One request per date, parameters T2M, T2M_MAX and T2M_MIN, CSV download. The unedited files are in data/hand_check. They are compared with the daily values we fetched through the POWER daily API (lab/cache), by lab/hand_check.py.

Result: 5 places, 2 dates, 30 values, 0 mismatches, largest difference 0.000 C, limit 0.05 C. Verdict: passed.

What this shows: our stored values equal what NASA serves, so the download is faithful. What it does not show: that the MERRA-2 reanalysis matches real weather. That question is handled by the trust panel and the limits panel.

| Place | Date | Variable | Viewer (C) | Ours (C) | Difference | Match |
| --- | --- | --- | --- | --- | --- | --- |
| Karachi | 1990-01-10 | T2M | 20.62 | 20.62 | 0.00 | yes |
| Karachi | 1990-01-10 | T2M_MAX | 26.46 | 26.46 | 0.00 | yes |
| Karachi | 1990-01-10 | T2M_MIN | 15.66 | 15.66 | 0.00 | yes |
| Quetta | 1990-01-10 | T2M | 7.66 | 7.66 | 0.00 | yes |
| Quetta | 1990-01-10 | T2M_MAX | 15.89 | 15.89 | 0.00 | yes |
| Quetta | 1990-01-10 | T2M_MIN | 2.23 | 2.23 | 0.00 | yes |
| Lahore | 1990-01-10 | T2M | 12.87 | 12.87 | 0.00 | yes |
| Lahore | 1990-01-10 | T2M_MAX | 23.20 | 23.20 | 0.00 | yes |
| Lahore | 1990-01-10 | T2M_MIN | 5.52 | 5.52 | 0.00 | yes |
| Topi | 1990-01-10 | T2M | 12.80 | 12.80 | 0.00 | yes |
| Topi | 1990-01-10 | T2M_MAX | 20.28 | 20.28 | 0.00 | yes |
| Topi | 1990-01-10 | T2M_MIN | 8.51 | 8.51 | 0.00 | yes |
| Gilgit | 1990-01-10 | T2M | -9.02 | -9.02 | 0.00 | yes |
| Gilgit | 1990-01-10 | T2M_MAX | -4.90 | -4.90 | 0.00 | yes |
| Gilgit | 1990-01-10 | T2M_MIN | -12.60 | -12.60 | 0.00 | yes |
| Karachi | 2010-07-15 | T2M | 29.65 | 29.65 | 0.00 | yes |
| Karachi | 2010-07-15 | T2M_MAX | 32.84 | 32.84 | 0.00 | yes |
| Karachi | 2010-07-15 | T2M_MIN | 27.68 | 27.68 | 0.00 | yes |
| Quetta | 2010-07-15 | T2M | 25.79 | 25.79 | 0.00 | yes |
| Quetta | 2010-07-15 | T2M_MAX | 33.11 | 33.11 | 0.00 | yes |
| Quetta | 2010-07-15 | T2M_MIN | 18.61 | 18.61 | 0.00 | yes |
| Lahore | 2010-07-15 | T2M | 36.52 | 36.52 | 0.00 | yes |
| Lahore | 2010-07-15 | T2M_MAX | 42.22 | 42.22 | 0.00 | yes |
| Lahore | 2010-07-15 | T2M_MIN | 30.75 | 30.75 | 0.00 | yes |
| Topi | 2010-07-15 | T2M | 35.12 | 35.12 | 0.00 | yes |
| Topi | 2010-07-15 | T2M_MAX | 41.60 | 41.60 | 0.00 | yes |
| Topi | 2010-07-15 | T2M_MIN | 27.74 | 27.74 | 0.00 | yes |
| Gilgit | 2010-07-15 | T2M | 12.92 | 12.92 | 0.00 | yes |
| Gilgit | 2010-07-15 | T2M_MAX | 18.80 | 18.80 | 0.00 | yes |
| Gilgit | 2010-07-15 | T2M_MIN | 5.46 | 5.46 | 0.00 | yes |

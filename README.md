# Indus Detective

**Pakistan's nights are getting warmer. In 25 of 38 places, summer daytime highs are falling.**

45 years of daily NASA data, 38 places, one question: has Pakistan's temperature really changed, and where?

Live site: https://indus-detective.vercel.app

Method, data and checks: https://indus-detective.vercel.app/#method

Built for the NASA Space Apps Challenge 2026, challenge Earth System Trend Detective, by team GitGoblins.

## What it found

Change per decade from 1981 to 2025, national average of 38 NASA grid cells unless stated. The 95% range is the span of changes the data supports. Every number below is read from the project's data files and matches the live site.

| Question | Result per decade | Verdict |
| --- | --- | --- |
| Night time low, whole year | +0.20 °C (+0.08 to +0.32) | Statistically significant. 20 of 38 places rise and pass the strict test, none fall. |
| Night time low, Feb to Apr | +0.39 °C (+0.24 to +0.57) | Statistically significant. 36 of 38 places rise and pass the strict test. |
| Daytime high, Jul to Sep | −0.35 °C (−0.64 to −0.07) | Not conclusive nationally. 25 of 38 places fall and pass the strict test, 2 rise. |
| Summer gap between day and night | −0.50 °C (−0.69 to −0.28) | Statistically significant. Since 1998: −0.85 °C (−1.18 to −0.51), also statistically significant. |
| Average temperature, whole year | MERRA-2 +0.05 °C (−0.12 to +0.22), GISTEMP +0.34 °C (+0.25 to +0.42) | The two NASA products differ. MERRA-2 shows no clear trend, GISTEMP is statistically significant. |
| Against Pakistan's weather service (PMD) | Night low: PMD +0.26 °C. Daytime high: PMD +0.20 °C | The PMD night low value is inside the NASA range. The PMD daytime high value is outside the NASA range (NASA −0.10 °C, −0.32 to +0.12, no clear trend). |

The night time low series shows a level step near 1998 in 36 of 38 places (breaks between 1996 and 1999). NASA's reanalysis team documents that new satellite instruments entering the analysis can create level shifts in reanalysis series, and names an instrument change in 1998. For that reason every result is also shown for 1998 to 2025 next to the full period.

## Try it

Open the live site, pick a place, what to measure, a season and a period, or tap a dot on the map. Each choice shows the change per decade, its 95% range, a verdict in plain words and a chart. Hard words open a plain meaning when tapped.

## How it works

- **Data:** NASA POWER daily point data (MERRA-2 reanalysis) for 40 points across Pakistan, 1981 to 2025. They fall into 38 half degree grid cells of about 50 km. Daily mean, highest and lowest air temperature at 2 metres. Monthly and seasonal means are computed from the daily values, and a month counts only when every day has a value.
- **Trend:** Theil Sen slope per decade, with a 95% range from a moving block bootstrap (1000 resamples, blocks of 5 years).
- **Test:** Mann Kendall with pre whitening. Across places, a Benjamini Hochberg false discovery rate of 0.10.
- **Verdict:** one rule everywhere. Statistically significant when the range excludes zero and p is below 0.05, not conclusive when the range excludes zero but p does not agree, no clear trend when the range includes zero.
- **Cross checks:** NASA GISTEMP v4 for average temperature, PMD figures from press coverage of its 2026 report, and a Pettitt change point check for level steps.

The full explanation is on the [method page](https://indus-detective.vercel.app/#method).

## Checks

- Hand check: 5 places and 30 daily values matched NASA's own Data Access Viewer exactly. The method and the table are in [docs/HAND_CHECK.md](docs/HAND_CHECK.md).
- Tests on synthetic series with a known slope check the slope, the false alarm rate and how often the 95% range contains the true value.
- Random seeds are fixed, so rebuilding the data gives the same numbers.

## How to read the results

- A place is a grid cell about 50 km wide. It is not a weather station.
- Reanalysis trends can be affected by changes in the observing systems that feed the model, which is why the 1998 to 2025 view is shown next to the full period.
- A straight line trend summarises a whole period. Where the break check finds level steps, read the trend as the average change over that period.
- The two NASA products for average temperature give different trends, and both are shown as found.
- A 50 km reanalysis grid and ground stations measure different things, so a difference with PMD is shown as a finding.
- In synthetic tests the 95% ranges came out slightly narrow, so read each range as a minimum.

## Run the website

You need Node 20.19 or newer (or 22.12 or newer).

```bash
git clone https://github.com/thehassanbukhari/indus-detective.git
cd indus-detective/web
npm install
npm run dev
```

The site reads static JSON files and makes no request to NASA from the browser.

## Rebuild the data

Optional. The finished data files are already in the repository. Run these from the repository root with Python 3.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install numpy scipy pymannkendall requests netCDF4
mkdir -p lab/cache data/build
python3 lab/fetch_daily.py   # 40 daily point files from NASA POWER into lab/cache
python3 lab/build2.py        # yearly series, trends, false discovery rate
python3 lab/national.py      # national averages and the day minus night gap
python3 lab/breaks.py        # Pettitt break check and synthetic tests
python3 lab/gistemp.py       # needs lab/cache/gistemp1200_GHCNv4_ERSSTv5.nc from NASA GISS
```

Download the GISTEMP file (gistemp1200_GHCNv4_ERSSTv5.nc.gz) from data.giss.nasa.gov/gistemp, unzip it and place it in lab/cache. After a rebuild, `npm run dev` in web/ copies the new files into the site.

## Repository layout

```
web/              the website (React, Vite, Tailwind, TypeScript)
  src/            one component per panel
  public/data/    the JSON files the site reads
lab/              Python scripts that fetch the data and compute every result
data/build/       the JSON files the scripts write
data/hand_check/  NASA Data Access Viewer files used for the hand check
docs/             DECISIONS.md (why the analysis is built this way) and HAND_CHECK.md
```

## Credits and sources

- NASA POWER daily point data: https://power.larc.nasa.gov/ (referencing guide: https://power.larc.nasa.gov/docs/referencing/), built from the MERRA-2 reanalysis of the NASA Global Modeling and Assimilation Office.
- NASA GISTEMP version 4: GISTEMP Team, 2026: GISS Surface Temperature Analysis (GISTEMP), version 4. NASA Goddard Institute for Space Studies. https://data.giss.nasa.gov/gistemp/ (dataset accessed 2026-11-14). Lenssen et al. (2024), Journal of Geophysical Research: Atmospheres, doi:10.1029/2023JD040179.
- Pakistan Meteorological Department figures, quoted from press coverage of its 2026 report: [Geo News](https://www.geo.tv/latest/681138-pakistan-witnessing-faster-rise-in-night-temperatures-than-day-pmd), [The News](https://www.thenews.pk/print/1435219-pakistan-faces-frequent-climate-extremes) and Dawn (full links in the Sources panel of the site).
- Statistical methods: Theil (1950), Sen (1968), Mann (1945), Kendall (1975), Yue and Wang (2002), Benjamini and Hochberg (1995), Pettitt (1979). Full references with DOIs are on the [method page](https://indus-detective.vercel.app/#method).
- Software: NumPy, SciPy, pymannkendall (Hussain and Mahmud 2019, doi:10.21105/joss.01556), netCDF4 and requests for the data. React, Vite, Tailwind CSS and TypeScript for the site. Hosted on Vercel. No outside fonts, images or scripts are loaded.

## License

MIT, see [LICENSE](LICENSE). The data files in data/ and web/public/data/ are derived from NASA POWER and NASA GISTEMP, so please credit NASA and the sources above when you reuse them.

## Team

Team GitGoblins, NASA Space Apps Challenge 2026, Topi (virtual). Team lead: Syed Hassan Ali Bukhari.

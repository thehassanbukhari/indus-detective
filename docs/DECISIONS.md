# Decisions

Why we chose things, newest last. Project lead: Syed Hassan Ali Bukhari, team GitGoblins, NASA Space Apps Challenge 2026, Topi.

## Challenge
We chose Earth System Trend Detective. The question: has Pakistan warmed, and where? The site shows NASA's daily temperature data for 38 places over 45 years, the rate of change, and whether the change is statistically significant. The Pakistan Meteorological Department (PMD) figures sit next to NASA's. Where the two differ, the difference is shown as a finding: a 50 km reanalysis grid and ground stations measure different things. Wording follows the findings, never the other way round.

## Static site, no live calls
The app reads prebuilt JSON files only. No NASA request happens in the browser, so the demo cannot fail on rate limits or wifi. Python builds the data on a laptop, the web app only displays it.

## Data source
NASA POWER point API, 40 points across Pakistan. POWER snaps each point to a half degree cell, so 40 points collapse to 38 unique cells. A cell is about 50 km and is not a weather station. We never claim district level findings. POWER values come from MERRA 2 reanalysis, and reanalysis trends can be affected by changing observing systems. This is stated on screen.

## Daily means instead of monthly values
The monthly POWER values for daytime high and night time low turned out to be monthly extremes (hottest day, coldest night), not averages. We confirmed this by comparing with daily values at Topi, difference 0.000. All early max and min results were thrown away. Every temperature trend now comes from daily data averaged by us.

## Rainfall is not shown
POWER rainfall from the MERRA 2 backbone gave implausible values (about 400 mm in one February at Topi), jumped after 2021, and rose in all 38 cells. POWER documentation says data spanning a source change is not recommended for climate trends. The IMERG rainfall code exists in the POWER dictionary but returned only fill values in every test. So no rainfall trend is shown anywhere. The PMD rainfall claim is shown as the PMD number only. Temperature is the main story.

## Significance method
Tested on synthetic series with a known slope, 45 years. Mann Kendall with pre whitening gave a false positive rate of 5.2 percent with no autocorrelation and 8.0 percent with moderate autocorrelation. The Hamed and Rao version gave 7.2 and 16.8 percent, so we did not use it. Intervals come from a moving block bootstrap. Its coverage of the true slope was about 81 to 87 percent, not 95, so the ranges are slightly too narrow. We disclose this on the limits panel instead of chasing it further. Across places we use Benjamini Hochberg false discovery control at q 0.10. A place counts as significant only if it passes this and its range excludes zero.

## The 1997 level jump
National yearly series show a level jump after 1997, strongest for the night low. NASA's reanalysis team documents that new satellite instruments entering the analysis can create level shifts in reanalysis series, and names an instrument change in 1998. In our data the night low step sits between mid 1997 and early 1998 in most places. We show the full period 1981 to 2025 so numbers are comparable with PMD, and 1998 to 2025 for every variable next to it. The step is reported as found, with no single date or cause attached to it.

## Three way wording
Every significance statement uses the same rule: Yes (range excludes zero and p below 0.05), Not conclusive (range excludes zero but p does not agree), No (range includes zero). A bug in case file 1 used a two way rule and wrongly said the gap range includes zero when it did not. It was found, reproduced, fixed in one shared function and deployed.

## Map
A plain dot map with no country outline. Borders are politically sensitive and cost time, and the dots carry the message. Colour is the slope, a thick ring means significant.

## PMD numbers
We use the figures reported in the press for the PMD report of 2026, labelled that way on screen. If the PDF is found, the numbers are replaced with exact ones and page numbers.

## Case files
Case file 1 compares nights and days. Case file 2 covers spring, February to April. Case file 3 covers summer daytime highs, July to September, with the same chart and the same three way wording. A rainfall case file was cut because POWER rainfall is not reliable for trends. We dropped the word squeeze because the data does not show one.

## Hosting
Vercel only. A second mirror was dropped to save effort. The video and slides cover us if the site fails during judging.

## Break check wording
A Pettitt change point test locates level steps in the yearly series: the night low near 1997 to 1998 in most grid cells, the annual daytime high near 2005 and the summer daytime high near 2006 in some. The Pettitt p values ignore autocorrelation, so they are shown as descriptive only and never called significant. A straight trend of 0.9 C gives about 0.45 C difference around any split, so step sizes are never read as a share of the rise. All numbers on screen are read from the break check file.

## Trust grade
The trust panel grades each national trend by how many of three checks it passes: significant over 1981 to 2025, significant over 1998 to 2025 with the same sign, and no shared break year. A trend that fails the first check is shown as No clear trend over 1981 to 2025. A hand check mismatch would cap every grade at 1 of 3. The hand check passed, so no cap applies. Grades come from a fixed rule and are read from the JSON files.

## Wording and framing reset
The product is a NASA data explorer first and method checks support it. Public wording states findings, methods and sourced facts, and writes limits as guidance for use. The level step near 1997 to 1998 is described with NASA's own documentation of satellite instrument changes in reanalysis, our month by month timing, and the choice to show 1998 to 2025 next to the full period. The cause is not asserted.

## Label changes
PMD figures are labelled PMD report (2026) as reported in press, because Dawn reports the release in August. Trust grades are named by how many of the three checks a finding passes. The rule did not change.

## Sources and checks panel
Only confirmed, sourced items are shown: data and MERRA-2 links, the POWER citation guide, the press coverage of the PMD report, the hand check result and the build tools.

## Hand check
We compared 5 places and 30 daily values with NASA's own POWER Data Access Viewer. All matched, largest difference 0.00 C, so our stored values are NASA's values. The method and the table are in docs/HAND_CHECK.md.

## GISTEMP cross check
NASA GISTEMP version 4 (2 degree grid, land and ocean, built from GHCN v4 stations and ERSST v5) was added as a second NASA product for average temperature. It was downloaded on 2026-11-14. Each of our 38 places maps to its nearest GISTEMP cell, which gives 21 cells, and the same trend functions as the main analysis are used. It appears as one row in the PMD panel, next to MERRA-2 and PMD. GISTEMP has no day and night split, so it says nothing about the night and summer findings. The two NASA products differ for average temperature and the site shows both as found, without a cause.

# Decisions

Why we chose things, newest last. Project lead: Syed Hassan Ali Bukhari, team GitGoblins, NASA Space Apps Challenge 2026, Topi.

## Challenge
We chose Earth System Trend Detective. The question: can NASA data independently confirm the Pakistan Meteorological Department claims about how Pakistan has changed, show where and by how much, say whether the change is statistically real, and grade its own trustworthiness. If NASA disagrees with PMD, that is reported as the finding. Wording follows the findings, never the other way round.

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
National yearly series show a level jump after 1997, strongest for the night low. The cause is not verified. We show the full period 1981 to 2025 so numbers are comparable with PMD, and also 1998 to 2025 for every variable. We make no claim about the cause.

## Three way wording
Every significance statement uses the same rule: Yes (range excludes zero and p below 0.05), Not conclusive (range excludes zero but p does not agree), No (range includes zero). A bug in case file 1 used a two way rule and wrongly said the gap range includes zero when it did not. It was found, reproduced, fixed in one shared function and deployed.

## Map
A plain dot map with no country outline. Borders are politically sensitive and cost time, and the dots carry the message. Colour is the slope, a thick ring means significant.

## PMD numbers
We use the figures reported in the press for the PMD report of September 2026, labelled that way on screen. If the PDF is found, the numbers are replaced with exact ones and page numbers.

## Case files
Case file 1 compares nights and days. Case file 2 covers spring, February to April. We dropped the word squeeze because the data does not show one. Case file 3 on wet extremes and dry spells was cut because it needs rainfall and our rainfall is not reliable. We did not replace it with a summer cooling file because its cause is not validated.

## Hosting
Vercel only. A second mirror was dropped to save effort. The video and slides cover us if the site fails during judging.

## Still pending
Hand check of five grid cells against the POWER Data Access Viewer. Result will be added here and overrides any wording that it contradicts.

## Break check wording
A Pettitt change point test found that the night low jumps in about the same year (1998) in nearly every grid cell, that the daytime high has a different break near 2005, and that the summer daytime high breaks near 2006. The case files now say that most of the night low rise sits in one jump rather than steady warming. All numbers on screen are read from the break check file. The cause is not claimed. The Pettitt p values ignore autocorrelation, so they are shown as descriptive only and never called significant.

## Trust grade
The trust panel grades each national trend with a fixed rule. It must be significant over 1981 to 2025, otherwise it is not a finding. It must also be significant from 1998 to 2025, and show no shared break year, to rank higher. The grade is Robust only if the hand check against the POWER viewer has passed. At the moment the two night low trends are Fragile and the other four are not findings.

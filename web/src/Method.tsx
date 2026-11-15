import type { ReactNode } from "react";
import PmdPanel, { type Nat, type Gist } from "./PmdPanel";
import Findings from "./Findings";
import TrustPanel from "./TrustPanel";
import SourcesPanel, { REPO } from "./SourcesPanel";
import { type BreaksFile } from "./breaks";

type CellLite = { name: string; trends: Record<string, { slope: number; sig: boolean } | null> };

export const BTN_OUT = "inline-flex min-h-11 items-center rounded-full border border-teal-700 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50";
export const BTN_FILL = "inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-base font-semibold text-white hover:bg-teal-800";

const SECTIONS = [
  ["summary", "Summary"], ["question", "Question"], ["data", "Data"], ["method", "Method"],
  ["checks", "Checks"], ["results", "Results"], ["reading", "How to read it"], ["code", "Code"], ["references", "References"],
];

const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const H2 = ({ id, n, children }: { id: string; n: number; children: ReactNode }) => (
  <h2 id={id} className="mt-10 scroll-mt-4 border-t border-slate-200 pt-6 text-xl font-semibold text-slate-900">{n}. {children}</h2>
);
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mt-5 text-base font-semibold text-slate-900">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="mt-2 leading-relaxed text-slate-700">{children}</p>;
const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="text-teal-700 underline" href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);
const Ref = ({ children }: { children: ReactNode }) => <li className="leading-relaxed">{children}</li>;

export default function Method({ nat, cells, breaks, gist }: { nat: Nat; cells: CellLite[]; breaks: BreaksFile; gist: Gist | null }) {
  const n = cells.length;
  return (
    <main className="mx-auto max-w-3xl p-4 text-slate-800">
      <p><a href="#" className={BTN_OUT}>Back to the explorer</a></p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">How Indus Detective works</h1>
      <p className="mt-2 text-slate-600">The question, the data, the method, the checks and how to read the results.</p>

      <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => jump(id)} className="min-h-11 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:border-teal-600">{label}</button>
        ))}
      </nav>

      <H2 id="summary" n={1}>Summary</H2>
      <P>Indus Detective asks whether Pakistan's temperature has changed since 1981, and where. It uses daily NASA data for {n} places across Pakistan from 1981 to 2025. For each place, variable, season and period it measures the change per decade, gives a 95% range for that change, and tests whether the change is statistically significant.</P>
      <P>The results are compared with figures from Pakistan's weather service (PMD) and with a second NASA analysis, GISTEMP, for average temperature. A change that is not statistically significant is a valid result and is shown as one.</P>
      <P>Sections 3 to 5 describe the data, the method and the checks. Section 6 shows the results, read from the same data files as the main page. Section 7 explains how to read them.</P>

      <H2 id="question" n={2}>Question and context</H2>
      <P>Pakistan's weather service (PMD) reported in 2026 on 45 years of climate change in Pakistan. Press coverage of the report describes a faster rise in night temperatures than in day temperatures, and declines in summer daytime highs in some areas. This project asks what an independent NASA record shows for the same period: where the temperature changed, by how much, and whether the change is larger than the normal ups and downs from year to year.</P>
      <P>The project answers the NASA Space Apps Challenge 2026 challenge Earth System Trend Detective. The challenge asks for chosen variables, regional data, a time series, the rate of change and a test of its significance.</P>

      <H2 id="data" n={3}>Data</H2>
      <H3>3.1 NASA POWER and MERRA-2</H3>
      <P>The main data are daily values from NASA POWER, which serves the MERRA-2 reanalysis. A reanalysis is a computer model that blends many observations into one complete record, so it has no gaps in time or place. The project requested three daily variables for 40 points across Pakistan, from 1 January 1981 to 31 December 2025: the daily mean air temperature 2 metres above the ground (T2M), the daily highest air temperature (T2M_MAX, shown as the daytime high) and the daily lowest air temperature (T2M_MIN, shown as the night time low).</P>
      <P>POWER places each point in a grid cell half a degree wide, about 50 km. The 40 points fall into {n} different cells, so the site shows {n} places, and a few places that share a cell are shown together in the place picker. A cell value is a smoothed average over the whole cell. It is not a weather station reading, and the cell elevation is not the elevation of a town.</P>
      <H3>3.2 From daily values to yearly series</H3>
      <P>POWER also offers monthly values for the highest and lowest temperature, but those are monthly extremes, such as the hottest day of the month. They are not averages, so they are not used. Every yearly value on the site is computed from the daily values.</P>
      <P>A month counts only when every day has a value, and a season counts in a year only when all its months count. The seasons are the whole year, February to April, July to September and December to February, where the December belongs to the year before the January and February. A seasonal value is the average of its monthly means. The day minus night gap is the yearly daytime high minus the yearly night time low.</P>
      <H3>3.3 NASA GISTEMP, a second NASA product</H3>
      <P>For average temperature the project adds NASA GISTEMP version 4 as a cross check. GISTEMP is a 2 degree grid of temperature anomalies on land and sea, built from weather station records (GHCN v4) and sea surface temperature (ERSST v5). The file was downloaded on 2026-11-14. Each of the {n} places is matched to the nearest GISTEMP cell centre{gist ? `, which gives ${gist.meta.cells} cells` : ""}, and the annual means of those cells are averaged. GISTEMP covers mean temperature only, so it has no day and night split. Anomalies are measured against 1951 to 1980, and trends do not depend on that base period (GISTEMP FAQ).</P>
      <H3>3.4 Pakistan Meteorological Department figures</H3>
      <P>The PMD figures are taken from press coverage of its 2026 report and are labelled PMD report (2026) as reported in press wherever they appear. The national figures cover the daytime high, the night time low and the average temperature for 1981 to 2025. Figures that the report gives only for some areas are labelled that way.</P>
      <H3>3.5 Rainfall</H3>
      <P>Rainfall is not shown as a trend. The rainfall values in this source looked implausible and shifted in recent years, so they are not reliable for trends. The PMD rainfall figure is shown as PMD's number only.</P>

      <H2 id="method" n={4}>Method</H2>
      <H3>4.1 Change per decade</H3>
      <P>For each place and each choice of variable, season and period, the yearly values are fitted with a straight line using the Theil Sen slope: the median of the slopes between every pair of years (Theil 1950, Sen 1968). The median keeps single unusual years from pulling the slope. The slope is shown per decade.</P>
      <H3>4.2 The 95% range</H3>
      <P>The 95% range comes from a moving block bootstrap. The method fits the line, takes the leftover difference for each year, and rebuilds 1000 artificial series by resampling those differences in blocks of 5 consecutive years, which keeps the link between neighbouring years. The range runs from the 2.5th to the 97.5th percentile of the 1000 slopes.</P>
      <H3>4.3 The significance test</H3>
      <P>The p value comes from a Mann Kendall trend test (Mann 1945, Kendall 1975) with pre whitening, which removes the correlation between neighbouring years before testing (Yue and Wang 2002). A place needs at least 25 years of values.</P>
      <H3>4.4 Many places at once</H3>
      <P>Testing {n} places at once produces some false alarms by chance. For each choice of variable, season and period, the p values of all places go through the Benjamini Hochberg procedure with a false discovery rate of 0.10 (Benjamini and Hochberg 1995). A place counts as statistically significant when it passes this procedure and its 95% range excludes zero.</P>
      <H3>4.5 National averages</H3>
      <P>The national value for each year is the plain average of the {n} cells. The same method is applied to that yearly series.</P>
      <H3>4.6 Three possible verdicts</H3>
      <P>One rule is used everywhere on the site.</P>
      <dl className="mt-2 space-y-2 text-slate-700">
        <div><dt className="inline font-semibold">Statistically significant: </dt><dd className="inline">the 95% range excludes zero and p is below 0.05.</dd></div>
        <div><dt className="inline font-semibold">Not conclusive: </dt><dd className="inline">the 95% range excludes zero, but p does not agree.</dd></div>
        <div><dt className="inline font-semibold">No clear trend: </dt><dd className="inline">the 95% range includes zero.</dd></div>
      </dl>
      <H3>4.7 Two periods</H3>
      <P>Every result is shown for 1981 to 2025 and for 1998 to 2025. NASA's reanalysis team documents that new satellite instruments entering the analysis can create level shifts in reanalysis series, and names an instrument change in 1998. In our data the night low step sits between mid 1997 and early 1998 in most places, so trends since 1998 are shown next to the full period.</P>
      <H3>4.8 Break check</H3>
      <P>A Pettitt change point test (Pettitt 1979) looks in each yearly series for the year where the level shifts most. Its p values are descriptive only, because the test does not account for correlation between neighbouring years. A straight trend alone also produces a gap between the averages before and after any split, so the size of a step is reported as a feature of the series and never as a share of the rise.</P>

      <H2 id="checks" n={5}>Checks</H2>
      <P>Three kinds of check support the results: a hand check of the stored data against NASA's own viewer, tests of the method on synthetic series with a known answer, and the break check. Each national trend then gets a grade from a fixed rule, shown below.</P>
      <TrustPanel nat={nat} breaks={breaks} />

      <H2 id="results" n={6}>Results</H2>
      <P>The findings and comparisons below are the same as on the main page and are read from the same data files.</P>
      <Findings nat={nat} cells={cells} />
      <PmdPanel nat={nat} cells={cells} gist={gist} />

      <H2 id="reading" n={7}>How to read the results</H2>
      <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed text-slate-700">
        <li>A place is a grid cell about 50 km wide. It is not a weather station, and nothing here is a district level finding.</li>
        <li>Reanalysis trends can be affected by changes in the observing systems that feed the model. The 1998 to 2025 view is shown next to the full period for that reason.</li>
        <li>A straight line trend summarises a whole period. Where the break check finds level steps, read the trend as the average change over that period.</li>
        <li>The national value is the average of the cells. Single places can differ from it, and the findings state both.</li>
        <li>For average temperature the two NASA products give different trends, and both are shown as found. GISTEMP uses station records and sea surface temperature on a 2 degree grid, MERRA-2 is a reanalysis on a 50 km grid, and the two sets of cells differ.</li>
        <li>PMD figures come from ground stations and are quoted from press coverage. A 50 km reanalysis grid and ground stations measure different things, so a difference with PMD is shown as a finding.</li>
        <li>In tests on synthetic series the 95% ranges came out slightly narrow, so read each range as a minimum.</li>
      </ul>

      <H2 id="code" n={8}>Code and data</H2>
      <P>Python scripts in the lab folder download the NASA data, compute the yearly series, the trends, the national averages, the break checks and the GISTEMP cross check, and write static JSON files. The website reads only those files and makes no request to NASA from your browser, so the results shown here come from the same files. The scripts, the data files and the hand check files are in the <L href={REPO}>project repository on GitHub</L>, released under the MIT license. No outside fonts, images or scripts are loaded.</P>
      <p className="mt-3"><a href={REPO} target="_blank" rel="noopener noreferrer" className={BTN_OUT}>View the repository on GitHub</a></p>

      <H2 id="references" n={9}>Sources and references</H2>
      <SourcesPanel gist={!!gist} />
      <H3>Statistical methods</H3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
        <Ref>Theil, H. (1950). A rank invariant method of linear and polynomial regression analysis (parts 1 to 3). Ned. Akad. Wetensch. Proc. Ser. A, 53, 1397 to 1412.</Ref>
        <Ref>Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. Journal of the American Statistical Association, 63(324), 1379 to 1389. <L href="https://doi.org/10.1080/01621459.1968.10480934">doi:10.1080/01621459.1968.10480934</L></Ref>
        <Ref>Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 245 to 259. <L href="https://doi.org/10.2307/1907187">doi:10.2307/1907187</L></Ref>
        <Ref>Kendall, M. (1975). Rank correlation measures. Charles Griffin, London.</Ref>
        <Ref>Yue, S., and Wang, C. Y. (2002). Applicability of prewhitening to eliminate the influence of serial correlation on the Mann Kendall test. Water Resources Research, 38(6). <L href="https://doi.org/10.1029/2001WR000861">doi:10.1029/2001WR000861</L></Ref>
        <Ref>Benjamini, Y., and Hochberg, Y. (1995). Controlling the false discovery rate: a practical and powerful approach to multiple testing. Journal of the Royal Statistical Society: Series B, 57(1), 289 to 300. <L href="https://doi.org/10.1111/j.2517-6161.1995.tb02031.x">doi:10.1111/j.2517-6161.1995.tb02031.x</L></Ref>
        <Ref>Pettitt, A. N. (1979). A non parametric approach to the change point problem. Applied Statistics, 28(2), 126 to 135. <L href="https://doi.org/10.2307/2346729">doi:10.2307/2346729</L></Ref>
        <Ref>Hussain, M., and Mahmud, I. (2019). pyMannKendall: a python package for non parametric Mann Kendall family of trend tests. Journal of Open Source Software, 4(39), 1556. <L href="https://doi.org/10.21105/joss.01556">doi:10.21105/joss.01556</L></Ref>
      </ul>
      <H3>Data and reanalysis</H3>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
        <Ref>Lenssen, N., et al. (2024). Journal of Geophysical Research: Atmospheres, 129(17), e2023JD040179. <L href="https://doi.org/10.1029/2023JD040179">doi:10.1029/2023JD040179</L> (GISTEMP version 4).</Ref>
        <Ref>NASA GMAO science snapshot, MERRA-2: Global Precipitation Time Series. New satellite sensors can cause discontinuities in reanalysis output. <L href="https://gs6101-gmao.gsfc.nasa.gov/science-snapshots/merra-2-global-precipitation-time-series">gs6101-gmao.gsfc.nasa.gov</L></Ref>
        <Ref>Stauffer, R. M., et al. (2019). Journal of Geophysical Research: Atmospheres. An observing system change after 1998 affects MERRA-2 based ozone simulations. <L href="https://doi.org/10.1029/2019JD030257">doi:10.1029/2019JD030257</L></Ref>
      </ul>

      <p className="mt-10"><a href="#" className={BTN_FILL}>Back to the explorer</a></p>
      <p className="mt-4 text-sm text-slate-600">Data: NASA POWER (MERRA-2). Built by team GitGoblins for NASA Space Apps Challenge 2026. <L href={REPO}>Source code on GitHub</L>.</p>
    </main>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import PmdPanel, { type Nat, type Gist } from "./PmdPanel";
import CaseFile1 from "./CaseFile1";
import CaseFile2 from "./CaseFile2";
import CaseFile3 from "./CaseFile3";
import TrustPanel from "./TrustPanel";
import SourcesPanel from "./SourcesPanel";
import Findings from "./Findings";
import { brk, type BreaksFile } from "./breaks";

type Trend = { slope: number; lo: number; hi: number; p: number; n: number; sig: boolean };
type Cell = { name: string; aliases: string[]; lat: number; lon: number; trends: Record<string, Trend | null> };
type Series = Record<string, Record<string, Record<string, number>>>;

const VARS = [
  { id: "T2M", label: "Average temperature", def: "The daily mean air temperature 2 metres above the ground." },
  { id: "T2M_MAX", label: "Daytime high", def: "The daily highest air temperature. It describes days." },
  { id: "T2M_MIN", label: "Night time low", def: "The daily lowest air temperature. It describes nights." },
];
const SEASONS = [
  { id: "annual", label: "Whole year" },
  { id: "FMA", label: "Feb to Apr (spring)" },
  { id: "JAS", label: "Jul to Sep (monsoon season)" },
  { id: "DJF", label: "Dec to Feb (winter)" },
];
const WINDOWS = [
  { id: "1981", label: "1981 to 2025" },
  { id: "1998", label: "1998 to 2025" },
];

const base = import.meta.env.BASE_URL;
const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);

function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function Chart({ years, vals, slope, x0 }: { years: number[]; vals: number[]; slope: number; x0: number }) {
  const W = 560, H = 340, ml = 58, mr = 74, mt = 40, mb = 38;
  const y0 = Math.min(...vals) - 0.3, y1 = Math.max(...vals) + 0.3;
  const sx = (x: number) => ml + ((x - x0) / (2025 - x0)) * (W - ml - mr);
  const sy = (y: number) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
  const k = slope / 10;
  const b = median(vals.map((v, i) => v - k * years[i]));
  const line = years.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(vals[i]).toFixed(1)}`).join(" ");
  const yt = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  const xt = x0 === 1981 ? [1985, 1995, 2005, 2015, 2025] : [2000, 2005, 2010, 2015, 2020, 2025];
  // Direct labels at the right end of the two lines, pushed apart when the lines end close together.
  const yEnd = sy(vals[vals.length - 1]), yTr = sy(k * 2025 + b);
  const yHi = Math.min(yEnd, yTr), yLo = Math.max(yEnd, yTr);
  const spread = Math.max(0, 26 - (yLo - yHi)) / 2;
  const clamp = (y: number) => Math.min(H - mb - 2, Math.max(mt + 8, y));
  const seriesHigher = yEnd <= yTr;
  const yS = clamp((seriesHigher ? yHi - spread : yLo + spread) + 6);
  const yT = clamp((seriesHigher ? yLo + spread : yHi - spread) + 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[600px]" role="img" aria-label="Yearly values with a straight line trend">
      <text x={ml} y={18} fontSize="17" fill="#475569">Temperature in {"\u00B0C"}</text>
      {yt.map((t) => (
        <g key={t}>
          <line x1={ml} x2={W - mr} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" />
          <text x={ml - 6} y={sy(t) + 5} textAnchor="end" fontSize="17" fill="#475569">{t.toFixed(1)}</text>
        </g>
      ))}
      {xt.map((t) => (
        <text key={t} x={sx(t)} y={H - 10} textAnchor="middle" fontSize="17" fill="#475569">{t}</text>
      ))}
      <path d={line} fill="none" stroke="#0f766e" strokeWidth="2.5" />
      <line x1={sx(x0)} y1={sy(k * x0 + b)} x2={sx(2025)} y2={sy(k * 2025 + b)} stroke="#dc2626" strokeWidth="2.5" strokeDasharray="7 5" />
      <text x={sx(2025) + 8} y={yS} fontSize="17" fontWeight="600" fill="#0f766e">Yearly</text>
      <text x={sx(2025) + 8} y={yT} fontSize="17" fontWeight="600" fill="#b91c1c">Trend</text>
    </svg>
  );
}

type V3 = "yes" | "inconclusive" | "no";
const V3_LABEL: Record<V3, string> = { yes: "Statistically significant", inconclusive: "Not conclusive", no: "No clear trend" };
const V3_MEAN: Record<V3, string> = {
  yes: "It passes the strict test used when many places are compared at once.",
  inconclusive: "The range excludes zero, but the change does not pass the strict test used when many places are compared at once.",
  no: "The change could be natural variation.",
};
const V3_BAR: Record<V3, string> = { yes: "border-l-teal-600", inconclusive: "border-l-slate-500", no: "border-l-slate-300" };
const V3_BADGE: Record<V3, string> = {
  yes: "border-teal-300 bg-teal-50 text-teal-900",
  inconclusive: "border-slate-300 bg-slate-100 text-slate-800",
  no: "border-slate-300 bg-white text-slate-700",
};

const verdictOf = (t: Trend): V3 => (t.sig ? "yes" : t.lo > 0 || t.hi < 0 ? "inconclusive" : "no");

function ResultCard({ t, title }: { t: Trend | null; title: string }) {
  if (!t) return <p className="mt-4 text-sm">Not enough years for this view.</p>;
  const key = verdictOf(t);
  return (
    <div id="selected-result" className={"mt-4 scroll-mt-4 rounded border border-l-4 border-slate-200 p-3 " + V3_BAR[key]}>
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{fmt(t.slope)} {"\u00B0C"} per decade</p>
      <p className="text-sm tabular-nums text-slate-600">95% range {fmt(t.lo)} to {fmt(t.hi)}</p>
      <p className="mt-2">
        <span className={"inline-block rounded-full border px-2.5 py-0.5 text-sm font-medium " + V3_BADGE[key]}>{V3_LABEL[key]}</span>
      </p>
      <p className="mt-1 text-sm text-slate-700">{V3_MEAN[key]}</p>
    </div>
  );
}

function mix(a: number[], b: number[], f: number) {
  return a.map((x, i) => Math.round(x + (b[i] - x) * f));
}
const COLD = [37, 99, 235], MID = [241, 245, 249], HOT = [220, 38, 38];
function slopeColor(s: number, lim: number) {
  const c = mix(MID, s >= 0 ? HOT : COLD, Math.min(1, Math.abs(s) / lim));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function DotMap({ cells, tkey, selected, onPick }: { cells: Cell[]; tkey: string; selected: string; onPick: (n: string) => void }) {
  const W = 640, H = 600, ml = 40, mr = 12, mt = 12, mb = 28;
  const LON0 = 60.5, LON1 = 77.5, LAT0 = 23.5, LAT1 = 37.5;
  const sx = (lon: number) => ml + ((lon - LON0) / (LON1 - LON0)) * (W - ml - mr);
  const sy = (lat: number) => H - mb - ((lat - LAT0) / (LAT1 - LAT0)) * (H - mt - mb);
  const rows = cells.flatMap((c) => { const t = c.trends[tkey]; return t ? [{ c, t }] : []; });
  if (!rows.length) return <p className="p-2 text-sm">Not enough years for this view.</p>;
  const lim = Math.max(0.2, Math.ceil(Math.max(...rows.map((r) => Math.abs(r.t.slope))) * 10) / 10);
  const up = rows.filter((r) => r.t.slope > 0).length;
  const nsig = rows.filter((r) => r.t.sig).length;
  const nsigUp = rows.filter((r) => r.t.sig && r.t.slope > 0).length;
  const labelled = new Set(["Karachi", "Lahore", "Quetta", "Gilgit", "Islamabad", selected]);
  const grid = (c: number[]) => c.map(String);
  const gradient = `linear-gradient(to right, rgb(${COLD.join(",")}), rgb(${MID.join(",")}), rgb(${HOT.join(",")}))`;
  const sel = rows.find((r) => r.c.name === selected);
  // The three closest places, so a crowded area can be fixed with one tap on a button instead of a second try on a dot.
  const near = sel
    ? rows
        .filter((r) => r.c.name !== selected)
        .map((r) => ({ r, d: Math.hypot((r.c.lon - sel.c.lon) * Math.cos((sel.c.lat * Math.PI) / 180), r.c.lat - sel.c.lat) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .map((x) => x.r)
    : [];
  const toResult = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("selected-result")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[600px]" role="img" aria-label="Map of trend per grid cell" style={{ cursor: "pointer", touchAction: "manipulation" }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) * W) / r.width;
          const y = ((e.clientY - r.top) * H) / r.height;
          let best: string | null = null;
          let bd = Infinity;
          for (const { c } of rows) {
            const d = Math.hypot(sx(c.lon) - x, sy(c.lat) - y);
            if (d < bd) { bd = d; best = c.name; }
          }
          if (best && bd < 40) onPick(best);
        }}>
        {grid([65, 70, 75]).map((g) => (
          <g key={"lon" + g}>
            <line x1={sx(Number(g))} x2={sx(Number(g))} y1={mt} y2={H - mb} stroke="#e2e8f0" />
            <text x={sx(Number(g))} y={H - 8} textAnchor="middle" fontSize="16" fill="#475569">{g} E</text>
          </g>
        ))}
        {grid([25, 30, 35]).map((g) => (
          <g key={"lat" + g}>
            <line x1={ml} x2={W - mr} y1={sy(Number(g))} y2={sy(Number(g))} stroke="#e2e8f0" />
            <text x={ml - 6} y={sy(Number(g)) + 5} textAnchor="end" fontSize="16" fill="#475569">{g} N</text>
          </g>
        ))}
        {rows.map(({ c, t }) => {
          const exc = t.lo > 0 || t.hi < 0;
          return (
            <g key={c.name}>
              <title>{`${c.name}: ${fmt(t.slope)} \u00B0C per decade (${fmt(t.lo)} to ${fmt(t.hi)})${t.sig ? ", significant" : ""}`}</title>
              {c.name === selected && <circle cx={sx(c.lon)} cy={sy(c.lat)} r={15} fill="none" stroke="#0f766e" strokeWidth={2} />}
              <circle cx={sx(c.lon)} cy={sy(c.lat)} r={t.sig ? 10 : 8} fill={slopeColor(t.slope, lim)}
                stroke={t.sig ? "#0f172a" : exc ? "#475569" : "#94a3b8"} strokeWidth={t.sig ? 3 : 1.2} />
            </g>
          );
        })}
        {rows.filter((r) => labelled.has(r.c.name)).map(({ c }) => (
          <text key={"l" + c.name} x={sx(c.lon) + 12} y={sy(c.lat) + 5} fontSize="17" fill="#1e293b" style={{ pointerEvents: "none" }}>{c.name}</text>
        ))}
      </svg>
      <div className="mx-2 mt-1 flex items-center gap-2 text-sm text-slate-600">
        <span>{"\u2212"}{lim.toFixed(1)}</span>
        <div className="h-3 flex-1 rounded" style={{ background: gradient }} />
        <span>+{lim.toFixed(1)} {"\u00B0C"} per decade</span>
      </div>
      <p className="mx-2 mt-2 text-sm text-slate-600">
        Big dot with a thick black ring: significant. Thin dark ring: the range excludes zero but it fails the strict test. Light ring: could be natural variation.
      </p>
      <p className="mx-2 mt-1 text-sm">
        {rows.length} places: {up} rising, {rows.length - up} falling. {nsig} pass the strict test ({nsigUp} rising, {nsig - nsigUp} falling).
      </p>
      {sel && (
        <div className={"mx-2 mt-3 rounded border border-l-4 border-slate-200 p-3 " + V3_BAR[verdictOf(sel.t)]}>
          <p className="font-semibold text-slate-900">{sel.c.name}</p>
          <p className="text-sm tabular-nums text-slate-700">{fmt(sel.t.slope)} {"\u00B0C"} per decade (95% range {fmt(sel.t.lo)} to {fmt(sel.t.hi)})</p>
          <p className="mt-1">
            <span className={"inline-block rounded-full border px-2.5 py-0.5 text-sm font-medium " + V3_BADGE[verdictOf(sel.t)]}>{V3_LABEL[verdictOf(sel.t)]}</span>
          </p>
          <button type="button" onClick={toResult} className="mt-1 flex min-h-11 items-center text-sm text-teal-700 underline">See its chart</button>
          {near.length > 0 && (
            <div>
              <p className="text-sm text-slate-600">Nearby places, tap to switch:</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {near.map(({ c }) => (
                  <button key={c.name} type="button" onClick={() => onPick(c.name)} className="min-h-11 rounded-full border border-slate-300 px-3 text-sm text-slate-800">{c.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [nat, setNat] = useState<Nat | null>(null);
  const [breaks, setBreaks] = useState<BreaksFile | null>(null);
  const [gist, setGist] = useState<Gist | null>(null);
  const [name, setName] = useState("Topi");
  const [v, setV] = useState("T2M");
  const [season, setSeason] = useState("annual");
  const [win, setWin] = useState("1981");
  const [err, setErr] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const keepTop = useRef<number | null>(null);
  const pick = (n: string) => {
    if (n === name) return;
    if (mapRef.current) keepTop.current = mapRef.current.getBoundingClientRect().top;
    setName(n);
  };
  useLayoutEffect(() => {
    if (keepTop.current === null || !mapRef.current) return;
    const d = mapRef.current.getBoundingClientRect().top - keepTop.current;
    keepTop.current = null;
    if (Math.abs(d) > 1) window.scrollBy(0, d);
  }, [name]);

  useEffect(() => {
    Promise.all([
      fetch(base + "data/trends.json").then((r) => r.json()),
      fetch(base + "data/series.json").then((r) => r.json()),
      fetch(base + "data/national.json").then((r) => r.json()),
      fetch(base + "data/breaks.json").then((r) => r.json()),
    ])
      .then(([c, s, n, b]) => { setCells(c); setSeries(s); setNat(n); setBreaks(b); })
      .catch((e) => setErr(String(e)));
  }, []);

  // GISTEMP is optional: if the file is missing or fails, the site loads without that row.
  useEffect(() => {
    fetch(base + "data/gistemp.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => { if (g && g["T2M|annual"] && g["T2M|annual@1998"] && g.meta) setGist(g); })
      .catch(() => {});
  }, []);

  if (err) return <p className="p-6">Could not load data: {err}</p>;
  if (!cells || !series || !nat || !breaks) return <p className="p-6">Loading NASA data</p>;

  const cell = cells.find((c) => c.name === name) ?? cells[0];
  const key = `${v}|${season}`;
  const t = cell.trends[win === "1998" ? `${key}@1998` : key];
  const raw = series[cell.name][key];
  const x0 = Number(win);
  const years = Object.keys(raw).map(Number).filter((y) => y >= x0).sort((a, b) => a - b);
  const vals = years.map((y) => raw[String(y)]);
  const vinfo = VARS.find((x) => x.id === v)!;
  const sinfo = SEASONS.find((x) => x.id === season)!;
  const jumpYear = brk(breaks, "T2M_MIN|annual")?.national.year;
  const sel = "ml-2 rounded border border-slate-300 p-1";

  return (
    <main className="mx-auto max-w-3xl p-4 text-slate-800">
      <h1 className="text-2xl font-semibold">Indus Detective</h1>
      <p className="mt-1 text-sm text-slate-600">
        How has Pakistan's temperature changed since 1981? Daily NASA data, 38 places, 45 years.
      </p>

      <p className="mt-4 max-w-2xl leading-relaxed text-slate-700">
        We asked whether Pakistan's temperature has really changed since 1981. We used daily NASA MERRA-2 data for {cells.length} places{gist ? ", and NASA GISTEMP, a second NASA analysis built from weather stations and sea surface temperature, as a cross check for average temperature" : ""}. For each place we measured the change per decade and tested whether it is statistically significant. Then we compared the results with Pakistan's weather service (PMD).
      </p>

      <Findings nat={nat} cells={cells} />

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-sm">
          Place
          <select className={sel} value={cell.name} onChange={(e) => setName(e.target.value)}>
            {cells.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}{c.aliases.length ? ` (also ${c.aliases.join(", ")})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Variable
          <select className={sel} value={v} onChange={(e) => setV(e.target.value)}>
            {VARS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Season
          <select className={sel} value={season} onChange={(e) => setSeason(e.target.value)}>
            {SEASONS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Years
          <select className={sel} value={win} onChange={(e) => setWin(e.target.value)}>
            {WINDOWS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-600">{vinfo.def} Each point is the average for {sinfo.label.toLowerCase()} of one year.</p>
      {win === "1998" && (
        <p className="mt-1 text-sm text-slate-600">{`This view starts after a level jump near ${jumpYear} that the break check found in the national series, so the jump does not count as a trend.`}</p>
      )}

      <ResultCard t={t} title={`${cell.name}: ${vinfo.label}, ${sinfo.label}, ${win} to 2025`} />

      <div className="mt-3 rounded border border-slate-200 p-2">
        <Chart years={years} vals={vals} slope={t ? t.slope : 0} x0={x0} />
        <p className="px-2 pb-1 text-sm text-slate-700">Teal: the yearly average. Red dashed: a straight line fitted through those years, which shows the overall direction.</p>
      </div>

      {t && (
        <dl className="mt-4 grid gap-2 text-sm">
          <div><dt className="inline font-semibold">What: </dt><dd className="inline">{vinfo.label} change over time, {sinfo.label.toLowerCase()}.</dd></div>
          <div><dt className="inline font-semibold">Where: </dt><dd className="inline">NASA grid cell around {cell.lat.toFixed(2)} N, {cell.lon.toFixed(2)} E, about 50 km wide. It is not a weather station.</dd></div>
        </dl>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Where is it changing?</h2>
        <p className="mt-1 text-sm text-slate-600">
          One dot per NASA grid cell, coloured by the trend for the variable, season and years chosen above. Tap a dot to select that place. Its result appears under the map.
        </p>
        <div ref={mapRef} className="mt-2 rounded border border-slate-200 p-2">
          <DotMap cells={cells} tkey={win === "1998" ? `${key}@1998` : key} selected={cell.name} onPick={pick} />
        </div>
      </section>

      <CaseFile1 nat={nat} cells={cells} series={series} breaks={breaks} />
      <CaseFile2 nat={nat} cells={cells} series={series} breaks={breaks} />
      <CaseFile3 nat={nat} cells={cells} series={series} breaks={breaks} />

      <PmdPanel nat={nat} cells={cells} gist={gist} />

      <TrustPanel nat={nat} breaks={breaks} />

      <SourcesPanel gist={!!gist} />

      <details className="mt-6 rounded border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">About this data and its limits</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          <li>Source: NASA POWER daily data, built from the MERRA-2 reanalysis, 1981 to 2025. A reanalysis is a computer model constrained by observations, so trends can be affected by changes in the observing systems.</li>
          <li>Each place is a grid cell about 50 km wide. It is not a weather station, and nothing here is a district level finding.</li>
          <li>Values are averages of daily highs, daily lows and daily means. Monthly extremes are not used.</li>
          <li>Trend: Theil Sen slope with a 95% range from a block bootstrap. Tests in our own checks show these ranges are slightly too narrow (roughly 80 to 87 in 100 cover the truth, not 95).</li>
          <li>Significant means the change passes a test that accounts for many correlated years and for checking 38 places at once, and its range excludes zero.</li>
          <li>{`The national night time low shows a level jump near ${jumpYear}. NASA\u2019s reanalysis team documents that new satellite instruments entering the analysis can create level shifts in reanalysis series, and names an instrument change in 1998, so the 1998 to 2025 view is offered next to the full period. See the trust panel for the break check.`}</li>
          <li>Rainfall is not shown. The rainfall values in this source looked implausible and shifted in recent years, so they are not reliable for trends.</li>
        </ul>
      </details>

      <p className="mt-4 text-sm text-slate-600">Data: NASA POWER (MERRA-2). Built by team GitGoblins for NASA Space Apps Challenge 2026.</p>
    </main>
  );
}

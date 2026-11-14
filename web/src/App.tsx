import { useEffect, useState } from "react";

type Trend = { slope: number; lo: number; hi: number; p: number; n: number; sig: boolean };
type Cell = { name: string; aliases: string[]; lat: number; lon: number; trends: Record<string, Trend | null> };
type Series = Record<string, Record<string, Record<string, number>>>;

const VARS = [
  { id: "T2M", label: "Average temperature", def: "The daily mean air temperature 2 metres above the ground, averaged over the year." },
  { id: "T2M_MAX", label: "Daytime high", def: "The daily highest air temperature, averaged over the year. It describes days." },
  { id: "T2M_MIN", label: "Night time low", def: "The daily lowest air temperature, averaged over the year. It describes nights." },
];

const base = import.meta.env.BASE_URL;
const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);

function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function Chart({ years, vals, slope }: { years: number[]; vals: number[]; slope: number }) {
  const W = 640, H = 320, ml = 52, mr = 16, mt = 16, mb = 32;
  const y0 = Math.min(...vals) - 0.3, y1 = Math.max(...vals) + 0.3;
  const sx = (x: number) => ml + ((x - 1981) / (2025 - 1981)) * (W - ml - mr);
  const sy = (y: number) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
  const k = slope / 10;
  const b = median(vals.map((v, i) => v - k * years[i]));
  const line = years.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(vals[i]).toFixed(1)}`).join(" ");
  const yt = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {yt.map((t) => (
        <g key={t}>
          <line x1={ml} x2={W - mr} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" />
          <text x={ml - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{t.toFixed(1)}</text>
        </g>
      ))}
      {[1985, 1995, 2005, 2015, 2025].map((t) => (
        <text key={t} x={sx(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">{t}</text>
      ))}
      <text x={12} y={mt + 4} fontSize="11" fill="#64748b">{"\u00B0C"}</text>
      <path d={line} fill="none" stroke="#0f766e" strokeWidth="2" />
      <line x1={sx(1981)} y1={sy(k * 1981 + b)} x2={sx(2025)} y2={sy(k * 2025 + b)} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" />
    </svg>
  );
}

export default function App() {
  const [cells, setCells] = useState<Cell[] | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [name, setName] = useState("Topi");
  const [v, setV] = useState("T2M");
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(base + "data/trends.json").then((r) => r.json()),
      fetch(base + "data/series.json").then((r) => r.json()),
    ])
      .then(([c, s]) => { setCells(c); setSeries(s); })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <p className="p-6">Could not load data: {err}</p>;
  if (!cells || !series) return <p className="p-6">Loading</p>;

  const cell = cells.find((c) => c.name === name) ?? cells[0];
  const t = cell.trends[`${v}|annual`];
  const raw = series[cell.name][`${v}|annual`];
  const years = Object.keys(raw).map(Number).sort((a, b) => a - b);
  const vals = years.map((y) => raw[String(y)]);
  const vinfo = VARS.find((x) => x.id === v)!;

  return (
    <main className="mx-auto max-w-3xl p-4 text-slate-800">
      <h1 className="text-2xl font-semibold">Indus Detective</h1>
      <p className="mt-1 text-sm text-slate-600">
        Does NASA data show how Pakistan's temperature has changed since 1981? Prototype, not final.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-sm">
          Place
          <select className="ml-2 rounded border border-slate-300 p-1" value={cell.name} onChange={(e) => setName(e.target.value)}>
            {cells.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}{c.aliases.length ? ` (also ${c.aliases.join(", ")})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Variable
          <select className="ml-2 rounded border border-slate-300 p-1" value={v} onChange={(e) => setV(e.target.value)}>
            {VARS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-2 text-sm text-slate-600">{vinfo.def}</p>

      <div className="mt-4 rounded border border-slate-200 p-2">
        <Chart years={years} vals={vals} slope={t ? t.slope : 0} />
        <p className="px-2 text-xs text-slate-500">Yearly average (teal) and the straight line trend (red dashed), 1981 to 2025.</p>
      </div>

      {t && (
        <dl className="mt-4 grid gap-2 text-sm">
          <div><dt className="inline font-semibold">What: </dt><dd className="inline">{vinfo.label} change over time.</dd></div>
          <div><dt className="inline font-semibold">Where: </dt><dd className="inline">NASA grid cell around {cell.lat.toFixed(2)} N, {cell.lon.toFixed(2)} E, about 50 km wide. It is not a weather station.</dd></div>
          <div><dt className="inline font-semibold">How much: </dt><dd className="inline">{fmt(t.slope)} {"\u00B0C"} per decade (95% interval {fmt(t.lo)} to {fmt(t.hi)}).</dd></div>
          <div><dt className="inline font-semibold">Significant: </dt><dd className="inline">{t.sig ? "Yes, after correcting for testing many places at once." : "No. The change could be natural variation."}</dd></div>
        </dl>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Data: NASA POWER, built from the MERRA-2 reanalysis. Reanalysis trends can be affected by changes in the observing systems. Rainfall is not shown because the source is not reliable for trends.
      </p>
    </main>
  );
}

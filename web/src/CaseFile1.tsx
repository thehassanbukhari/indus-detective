import { PMD, verdict, verdictLabel } from "./PmdPanel";

type T = { slope: number; lo: number; hi: number; p: number; n: number };
type Nat = Record<string, T>;
type CellLite = { name: string; trends: Record<string, { slope: number } | null> };
type Series = Record<string, Record<string, Record<string, number>>>;

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
const YEARS = Array.from({ length: 45 }, (_, i) => 1981 + i);

const gapText = (g: T) => {
  const v = verdict(g);
  if (v === "yes") return "The gap change is statistically significant: its range excludes zero and p is below 0.05.";
  if (v === "inconclusive") return `The range of the gap excludes zero, but p is ${g.p.toFixed(3)}, not below 0.05, so the gap change is not conclusive.`;
  return "The range of the gap includes zero, so the difference between them is not conclusive.";
};

function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function national(series: Series, key: string) {
  const names = Object.keys(series);
  const years = YEARS.filter((y) => names.every((n) => series[n][key]?.[String(y)] !== undefined));
  const vals = years.map((y) => names.reduce((a, n) => a + series[n][key][String(y)], 0) / names.length);
  const base = vals.filter((_, i) => years[i] <= 1990);
  const b = base.reduce((a, x) => a + x, 0) / base.length;
  return { years, vals: vals.map((v) => v - b) };
}

type Line = { label: string; color: string; years: number[]; vals: number[]; slope: number };

export function TwoLines({ lines, jump = true, label = "Daytime high and night time low, national average change since 1981 to 1990" }: { lines: Line[]; jump?: boolean; label?: string }) {
  const W = 640, H = 320, ml = 52, mr = 16, mt = 16, mb = 32;
  const all = lines.flatMap((l) => l.vals);
  const y0 = Math.min(...all) - 0.3, y1 = Math.max(...all) + 0.3;
  const sx = (x: number) => ml + ((x - 1981) / (2025 - 1981)) * (W - ml - mr);
  const sy = (y: number) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
  const yt = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      {yt.map((t) => (
        <g key={t}>
          <line x1={ml} x2={W - mr} y1={sy(t)} y2={sy(t)} stroke="#e2e8f0" />
          <text x={ml - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{fmt(t)}</text>
        </g>
      ))}
      {[1985, 1995, 2005, 2015, 2025].map((t) => (
        <text key={t} x={sx(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">{t}</text>
      ))}
      <text x={12} y={mt + 4} fontSize="11" fill="#64748b">{"\u00B0C"}</text>
      {jump && (
        <>
          <line x1={sx(1997.5)} x2={sx(1997.5)} y1={mt} y2={H - mb} stroke="#94a3b8" strokeDasharray="3 3" />
          <text x={sx(1997.5) + 4} y={mt + 10} fontSize="10" fill="#64748b">level jump around 1997</text>
        </>
      )}
      {lines.map((l) => {
        const k = l.slope / 10;
        const b = median(l.vals.map((v, i) => v - k * l.years[i]));
        const path = l.years.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(l.vals[i]).toFixed(1)}`).join(" ");
        return (
          <g key={l.label}>
            <path d={path} fill="none" stroke={l.color} strokeWidth="2" />
            <line x1={sx(1981)} y1={sy(k * 1981 + b)} x2={sx(2025)} y2={sy(k * 2025 + b)} stroke={l.color} strokeWidth="2" strokeDasharray="6 4" />
          </g>
        );
      })}
    </svg>
  );
}

export default function CaseFile1({ nat, cells, series }: { nat: Nat; cells: CellLite[]; series: Series }) {
  const mx = nat["T2M_MAX|annual"], mn = nat["T2M_MIN|annual"];
  if (!mx || !mn) return null;
  const dMax = national(series, "T2M_MAX|annual");
  const dMin = national(series, "T2M_MIN|annual");
  const rows = [
    { label: "Daytime high", id: "T2M_MAX" },
    { label: "Night time low", id: "T2M_MIN" },
    { label: "Gap: day high minus night low", id: "DTR" },
  ];
  const windows = [
    { sfx: "", label: "1981 to 2025" },
    { sfx: "@1998", label: "1998 to 2025" },
  ];
  const sentence = (sfx: string) => {
    const a = nat[`T2M_MAX|annual${sfx}`], b = nat[`T2M_MIN|annual${sfx}`], g = nat[`DTR|annual${sfx}`];
    if (!a || !b || !g) return "";
    return `${b.slope > a.slope ? "The night low trend is higher than the daytime high trend" : "The daytime high trend is higher than the night low trend"}. The night low changed ${fmt(b.slope)} and the daytime high ${fmt(a.slope)} \u00B0C per decade. ${gapText(g)}`;
  };
  const count = (sfx: string) => {
    const pairs = cells.flatMap((c) => {
      const a = c.trends[`T2M_MAX|annual${sfx}`], b = c.trends[`T2M_MIN|annual${sfx}`];
      return a && b ? [b.slope > a.slope] : [];
    });
    return { k: pairs.filter(Boolean).length, m: pairs.length };
  };
  const pmdMax = PMD.find((x) => x.id === "T2M_MAX"), pmdMin = PMD.find((x) => x.id === "T2M_MIN");
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Case file 1: nights versus days</h2>
      <p className="mt-1 text-sm text-slate-600">
        Is the night time low changing differently from the daytime high? National average of our 38 grid cells. The chart shows change from each line's own 1981 to 1990 average.
      </p>
      <div className="mt-2 rounded border border-slate-200 p-2">
        <TwoLines lines={[
          { label: "Daytime high", color: "#ea580c", years: dMax.years, vals: dMax.vals, slope: mx.slope },
          { label: "Night time low", color: "#2563eb", years: dMin.years, vals: dMin.vals, slope: mn.slope },
        ]} />
        <p className="px-2 text-xs text-slate-600">
          <span style={{ color: "#ea580c" }}>{"\u25A0"}</span> Daytime high <span style={{ color: "#2563eb" }}>{"\u25A0"}</span> Night time low. Yearly values are solid, straight line trends are dashed.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="p-2">Change per decade</th>
              {windows.map((w) => <th key={w.sfx} className="p-2">{w.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 align-top">
                <td className="p-2">{r.label}</td>
                {windows.map((w) => {
                  const t = nat[`${r.id}|annual${w.sfx}`];
                  return (
                    <td key={w.sfx} className="p-2">
                      {t ? `${fmt(t.slope)} (${fmt(t.lo)} to ${fmt(t.hi)}) \u00B0C` : ""}
                      <br />
                      <span className="text-xs text-slate-600">{t ? verdictLabel(t) : ""}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {windows.map((w) => {
          const c = count(w.sfx);
          return (
            <li key={w.sfx}>
              {w.label}: {sentence(w.sfx)} In {c.k} of {c.m} places the night low trend is higher than the daytime high trend.
            </li>
          );
        })}
        {pmdMax && pmdMin && (
          <li>
            PMD report (Sept 2026) as reported in press, 1981 to 2025: night low {fmt(pmdMin.value)}, daytime high {fmt(pmdMax.value)} {"\u00B0C"} per decade.
          </li>
        )}
        <li>
          A negative gap change means the gap between day and night is narrowing. This page shows what changed, not why. The jump around 1997 in the national series has an unknown cause, which is why the 1998 to 2025 view is shown next to the full period. Values are a 50 km reanalysis, not weather stations.
        </li>
      </ul>
    </section>
  );
}

import { Term, GLOSS } from "./Term";
// PMD numbers are the press reported figures. If the PMD PDF is found, replace the values below with the exact figures and page numbers.
type T = { slope: number; lo: number; hi: number; p: number; n: number };
export type Nat = Record<string, T>;
export type Gist = { "T2M|annual": T; "T2M|annual@1998": T; meta: { cells: number; first_year: number; last_year: number } };
type CellLite = { name: string; trends: Record<string, { slope: number } | null> };

export const PMD = [
  { id: "T2M_MAX", label: "Daytime high", value: 0.2 },
  { id: "T2M_MIN", label: "Night time low", value: 0.26 },
  { id: "T2M", label: "Average temperature", value: 0.21 },
];
const PMD_RAIN = "about 7.4 mm per decade decline, not statistically significant";
export const PMD_SPRING = 1.0;
export const PMD_SUMMER = 0.6;

export type Verdict = "yes" | "inconclusive" | "no";
type R = { lo: number; hi: number; p: number };
// Same three way rule as the per place text in App.tsx: Yes, Not conclusive, No.
export function verdict(t: R): Verdict {
  if (!(t.lo > 0 || t.hi < 0)) return "no";
  return t.p < 0.05 ? "yes" : "inconclusive";
}
export function verdictLabel(t: R): string {
  const v = verdict(t);
  if (v === "yes") return "statistically significant";
  if (v === "inconclusive") return `not conclusive (range excludes zero, p ${t.p.toFixed(3)})`;
  return "not statistically significant";
}

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);

const placeOf = (v: number, t: R) => (v < t.lo ? "below" : v > t.hi ? "above" : "inside");

// One row per variable: the NASA 95% range as a bar, the PMD press figure as a marker line. GISTEMP is a second bar for average temperature.
export function PmdChart({ nat, gist }: { nat: Nat; gist?: Gist | null }) {
  const rows = PMD.flatMap((r) => {
    const n = nat[`${r.id}|annual`];
    if (!n) return [];
    const g = r.id === "T2M" && gist && gist["T2M|annual"] ? gist["T2M|annual"] : null;
    return [{ id: r.id, label: r.label, pmd: r.value, bars: [{ name: "MERRA-2", t: n, c: "#0f766e" }, ...(g ? [{ name: "GISTEMP", t: g, c: "#5eead4" }] : [])] }];
  });
  if (!rows.length) return null;
  const W = 560, ml = 20, mr = 20, rowGap = 22, barH = 14, lineH = 28;
  const all = rows.flatMap((r) => [r.pmd, ...r.bars.flatMap((b) => [b.t.lo, b.t.hi])].concat(0));
  const step = 0.2;
  const d0 = Math.floor((Math.min(...all) - 0.05) / step) * step, d1 = Math.ceil((Math.max(...all) + 0.05) / step) * step;
  const sx = (v: number) => ml + ((v - d0) / (d1 - d0)) * (W - ml - mr);
  const ticks: number[] = [];
  for (let v = d0; v <= d1 + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  let y = 10;
  const blocks = rows.map((r) => {
    const top = y;
    const barsTop = top + 26;
    const h = r.bars.length * lineH;
    y = barsTop + h + rowGap;
    return { r, top, barsTop, h };
  });
  const H = y - rowGap + 56;
  const axisY = y - rowGap + 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[600px]" role="img" aria-label="NASA 95% ranges for the national trend next to the PMD figures">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={6} y2={axisY} stroke={Math.abs(t) < 1e-9 ? "#475569" : "#e2e8f0"} strokeDasharray={Math.abs(t) < 1e-9 ? "4 3" : undefined} />
          <text x={sx(t)} y={axisY + 20} textAnchor="middle" fontSize="16" fill="#475569">{fmt(t)}</text>
        </g>
      ))}
      <text x={W - mr} y={axisY + 40} textAnchor="end" fontSize="15" fill="#475569">{"\u00B0C"} per decade, 1981 to 2025</text>
      {blocks.map(({ r, top, barsTop, h }) => (
        <g key={r.id}>
          <text x={ml} y={top + 16} fontSize="17" fontWeight="600" fill="#0f172a">{r.label}</text>
          {r.bars.map((b, i) => {
            const by = barsTop + i * lineH + 4;
            return (
              <g key={b.name}>
                <rect x={sx(b.t.lo)} y={by} width={Math.max(2, sx(b.t.hi) - sx(b.t.lo))} height={barH} rx="2" fill={b.c} />
                <circle cx={sx(b.t.slope)} cy={by + barH / 2} r="4" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
                <text x={sx(Math.max(b.t.hi, r.pmd)) + 8} y={by + barH - 1} fontSize="15" fill="#334155">{b.name}</text>
              </g>
            );
          })}
          <line x1={sx(r.pmd)} x2={sx(r.pmd)} y1={barsTop - 2} y2={barsTop + h} stroke="#475569" strokeWidth="3" />
          <text x={sx(r.pmd)} y={barsTop - 6} textAnchor="middle" fontSize="15" fontWeight="600" fill="#475569">PMD</text>
        </g>
      ))}
    </svg>
  );
}

export default function PmdPanel({ nat, cells, gist }: { nat: Nat; cells: CellLite[]; gist?: Gist | null }) {
  const mer = nat["T2M|annual"], mer98 = nat["T2M|annual@1998"];
  const pmdMean = PMD.find((x) => x.id === "T2M");
  const gAll = gist ? gist["T2M|annual"] : null, g98 = gist ? gist["T2M|annual@1998"] : null;
  const two = !!(gist && gAll && g98 && mer && mer98 && pmdMean);
  const cellTxt = (t: T) => (
    <>
      <div>{fmt(t.slope)} ({fmt(t.lo)} to {fmt(t.hi)}) {"\u00B0C"}</div>
      <div>{verdictLabel(t)}</div>
    </>
  );
  const cmp = PMD.flatMap((r) => { const n = nat[`${r.id}|annual`]; return n ? [{ name: r.label.toLowerCase(), inside: r.value >= n.lo && r.value <= n.hi }] : []; });
  const ins = cmp.filter((x) => x.inside).map((x) => x.name), outs = cmp.filter((x) => !x.inside).map((x) => x.name);
  const claim = [ins.length ? `The PMD figure is inside the NASA range for ${ins.join(" and ")}.` : "", outs.length ? `It is outside the NASA range for ${outs.join(" and ")}.` : ""].filter(Boolean).join(" ");
  const spring = nat["T2M_MAX|FMA"];
  const steep = cells
    .flatMap((c) => { const t = c.trends["T2M_MAX|FMA"]; return t ? [{ name: c.name, slope: t.slope }] : []; })
    .sort((a, b) => b.slope - a.slope)[0];
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Does NASA agree with Pakistan's weather service?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Change per decade, 1981 to 2025. PMD figures are labelled: PMD report (2026) as reported in press. They come from ground stations. The NASA figure is the average of our 38 grid cells.
      </p>
      <p className="mt-3 text-base font-semibold text-slate-900">{claim}</p>
      <div className="mt-2 rounded border border-slate-200 p-2">
        <PmdChart nat={nat} gist={gist} />
        <p className="px-2 pb-1 text-sm text-slate-700">Bars: the NASA 95% range for the national trend, from MERRA-2 and, for average temperature, GISTEMP. White dot: the NASA trend. Grey line: the PMD figure as reported in press. Dashed line: zero change.</p>
      </div>
      <details className="mt-3 rounded border border-slate-200 p-3 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Numbers and sources</summary>
      <div className="mt-2 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="p-2">Variable</th>
              <th className="p-2">PMD</th>
              <th className="p-2">NASA, 95% range</th>
              <th className="p-2">Comparison</th>
            </tr>
          </thead>
          <tbody>
            {PMD.map((r) => {
              const n = nat[`${r.id}|annual`];
              if (!n) return null;
              const inside = r.value >= n.lo && r.value <= n.hi;
              return (
                <tr key={r.id} className="border-t border-slate-200 align-top">
                  <td className="p-2">{r.label}</td>
                  <td className="p-2">{fmt(r.value)} {"\u00B0C"}</td>
                  <td className="p-2">{fmt(n.slope)} ({fmt(n.lo)} to {fmt(n.hi)}) {"\u00B0C"}</td>
                  <td className="p-2">
                    {inside ? "Consistent: the PMD value is inside the NASA range." : "Different: the PMD value is outside the NASA range."}{" "}
                    The NASA trend is {verdictLabel(n)}.
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {two && gist && gAll && g98 && pmdMean && (
        <div className="mt-5">
          <h3 className="text-base font-semibold">Average temperature in two NASA products</h3>
          <p className="mt-1 text-sm text-slate-600">
            NASA GISTEMP is a second NASA product for the same question. It is a 2 degree grid analysis built from land weather station records and sea surface temperature, given as anomalies. We averaged the {gist.meta.cells} grid cells that hold our 38 places, {gist.meta.first_year} to {gist.meta.last_year}. It covers mean temperature only, so it says nothing about days or nights. NASA gives no range for a single region, so the range shown is ours, from the same method as the other rows.
          </p>
          <div className="mt-2 overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="p-2">Source</th>
                  <th className="p-2">1981 to 2025</th>
                  <th className="p-2">1998 to 2025</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200 align-top">
                  <td className="p-2">PMD report (2026) as reported in press</td>
                  <td className="p-2">{fmt(pmdMean.value)} {"\u00B0C"}</td>
                  <td className="p-2">No figure given</td>
                </tr>
                <tr className="border-t border-slate-200 align-top">
                  <td className="p-2">NASA MERRA-2 (38 cells)</td>
                  <td className="p-2">{cellTxt(mer)}</td>
                  <td className="p-2">{cellTxt(mer98)}</td>
                </tr>
                <tr className="border-t border-slate-200 align-top">
                  <td className="p-2">NASA GISTEMP ({gist.meta.cells} cells)</td>
                  <td className="p-2">{cellTxt(gAll)}</td>
                  <td className="p-2">{cellTxt(g98)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              For 1981 to 2025 the two NASA products give different trends: {fmt(gAll.slope)} {"\u00B0C"} per decade for GISTEMP and {fmt(mer.slope)} {"\u00B0C"} per decade for MERRA-2. The PMD figure of {fmt(pmdMean.value)} {"\u00B0C"} is {placeOf(pmdMean.value, mer)} the MERRA-2 range and {placeOf(pmdMean.value, gAll)} the GISTEMP range.
            </li>
            <li>
              {Math.sign(mer98.slope) !== Math.sign(g98.slope)
                ? `Since 1998 the two trends have opposite signs: MERRA-2 ${fmt(mer98.slope)} and GISTEMP ${fmt(g98.slope)} \u00B0C per decade.`
                : `Since 1998 both trends have the same sign: MERRA-2 ${fmt(mer98.slope)} and GISTEMP ${fmt(g98.slope)} \u00B0C per decade.`}
            </li>
            <li>
              Both are shown as found. MERRA-2 is a <Term word="reanalysis">{GLOSS.reanalysis}</Term> on a 50 km grid, GISTEMP is a 2 degree analysis of station and sea surface records, and the two cell sets differ. Credit: NASA GISS/GISTEMP.
            </li>
          </ul>
        </div>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>
          Rainfall: PMD reports {PMD_RAIN}. NASA rainfall is not shown because the rainfall values in this source are not reliable for trends.
        </li>
        {spring && steep && (
          <li>
            Feb to Apr daytime high: PMD reports up to {PMD_SPRING.toFixed(0)} {"\u00B0C"} per decade in some areas. NASA national average {fmt(spring.slope)} ({fmt(spring.lo)} to {fmt(spring.hi)}) {"\u00B0C"} per decade. Steepest single NASA cell: {steep.name}, {fmt(steep.slope)} {"\u00B0C"} per decade.
          </li>
        )}
        <li>
          These are straight line trends over 1981 to 2025. The break check found level steps in some yearly series, so read each trend as the average change over the period.
        </li>
        <li>
          Differences are shown as found. A 50 km reanalysis grid and ground stations measure different things, and our national average is a plain average of the 38 cells, not weighted by area.
        </li>
      </ul>
      </details>
    </section>
  );
}

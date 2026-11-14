// PMD numbers are the press reported figures. If the PMD PDF is found, replace the values below with the exact figures and page numbers.
type T = { slope: number; lo: number; hi: number; p: number; n: number };
export type Nat = Record<string, T>;
type CellLite = { name: string; trends: Record<string, { slope: number } | null> };

export const PMD = [
  { id: "T2M_MAX", label: "Daytime high", value: 0.2 },
  { id: "T2M_MIN", label: "Night time low", value: 0.26 },
  { id: "T2M", label: "Average temperature", value: 0.21 },
];
const PMD_RAIN = "about 7.4 mm per decade decline, not statistically significant";
const PMD_SPRING = 1.0;

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);

export default function PmdPanel({ nat, cells }: { nat: Nat; cells: CellLite[] }) {
  const spring = nat["T2M_MAX|FMA"];
  const steep = cells
    .flatMap((c) => { const t = c.trends["T2M_MAX|FMA"]; return t ? [{ name: c.name, slope: t.slope }] : []; })
    .sort((a, b) => b.slope - a.slope)[0];
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Does NASA agree with Pakistan's weather service?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Change per decade, 1981 to 2025. PMD figures are labelled: PMD report (Sept 2026) as reported in press. They come from ground stations. The NASA figure is the average of our 38 grid cells.
      </p>
      <div className="mt-2 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
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
              const real = (n.lo > 0 || n.hi < 0) && n.p < 0.05;
              return (
                <tr key={r.id} className="border-t border-slate-200 align-top">
                  <td className="p-2">{r.label}</td>
                  <td className="p-2">{fmt(r.value)} {"\u00B0C"}</td>
                  <td className="p-2">{fmt(n.slope)} ({fmt(n.lo)} to {fmt(n.hi)}) {"\u00B0C"}</td>
                  <td className="p-2">
                    {inside ? "Consistent: the PMD value is inside the NASA range." : "Different: the PMD value is outside the NASA range."}{" "}
                    {real ? "The NASA trend is statistically significant." : "The NASA trend is not statistically significant."}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
          Differences are shown as found. A 50 km reanalysis grid and ground stations measure different things, and our national average is a plain average of the 38 cells, not weighted by area.
        </li>
      </ul>
    </section>
  );
}

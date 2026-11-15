import { PMD_SUMMER, verdictLabel } from "./PmdPanel";
import { TwoLines, national } from "./CaseFile1";
import { brk, breakKind, breakSentence, type BreaksFile } from "./breaks";

type T = { slope: number; lo: number; hi: number; p: number; n: number };
type Nat = Record<string, T>;
type Cell = { name: string; trends: Record<string, (T & { sig: boolean }) | null> };
type Series = Record<string, Record<string, Record<string, number>>>;

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
const ROWS = [
  { id: "T2M_MAX", label: "Daytime high" },
  { id: "T2M_MIN", label: "Night time low" },
  { id: "DTR", label: "Gap: day high minus night low" },
];
const WINDOWS = [
  { sfx: "", label: "1981 to 2025" },
  { sfx: "@1998", label: "1998 to 2025" },
];

export default function CaseFile3({ nat, cells, series, breaks }: { nat: Nat; cells: Cell[]; series: Series; breaks: BreaksFile }) {
  const mx = nat["T2M_MAX|JAS"], mn = nat["T2M_MIN|JAS"];
  if (!mx || !mn) return null;
  const dMax = national(series, "T2M_MAX|JAS");
  const dMin = national(series, "T2M_MIN|JAS");
  const ts = cells.flatMap((c) => { const t = c.trends["T2M_MAX|JAS"]; return t ? [{ name: c.name, t }] : []; });
  const falling = ts.filter((x) => x.t.slope < 0).length;
  const sigDown = ts.filter((x) => x.t.sig && x.t.slope < 0).length;
  const sigUp = ts.filter((x) => x.t.sig && x.t.slope > 0).length;
  const steep = [...ts].sort((a, b) => a.t.slope - b.t.slope)[0];
  const bMax = brk(breaks, "T2M_MAX|JAS"), bMin = brk(breaks, "T2M_MIN|JAS");
  const kMax = bMax ? breakKind(bMax) : undefined;
  const stepYear = bMax && kMax !== "none" ? bMax.top_years[0][0] : undefined;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Case file 3: summer daytime highs, July to September</h2>
      <p className="mt-1 text-sm text-slate-600">
        Are summer days getting hotter or cooler? National average of our 38 grid cells. The chart shows change from each line's own 1981 to 1990 average.
      </p>
      {bMax && bMin && (
        <div className="mt-2 rounded border border-sky-300 bg-sky-50 p-3 text-sm text-slate-800">
          <p className="font-semibold">
            {stepYear !== undefined
              ? `How to read this chart: the summer daytime high series has a level step near ${stepYear}, shared by ${bMax.top_years[0][1]} of ${bMax.cells} places.`
              : "How to read this chart: the summer series and its level steps."}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>{breakSentence(bMax, "Summer daytime high")}</li>
            <li>{breakSentence(bMin, "Summer night time low")}</li>
          </ul>
        </div>
      )}
      <div className="mt-2 rounded border border-slate-200 p-2">
        <TwoLines
          label="Jul to Sep daytime high and night time low, national average change since 1981 to 1990"
          jumpYear={stepYear}
          lines={[
            { label: "Daytime high", color: "#ea580c", years: dMax.years, vals: dMax.vals, slope: mx.slope },
            { label: "Night time low", color: "#2563eb", years: dMin.years, vals: dMin.vals, slope: mn.slope },
          ]}
        />
        <p className="px-2 pb-1 text-sm text-slate-700">
          Orange: daytime high. Blue: night time low. Jul to Sep values are solid, straight line trends are dashed.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="p-2">Jul to Sep change per decade</th>
              {WINDOWS.map((w) => <th key={w.sfx} className="p-2">{w.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 align-top">
                <td className="p-2">{r.label}</td>
                {WINDOWS.map((w) => {
                  const t = nat[`${r.id}|JAS${w.sfx}`];
                  return (
                    <td key={w.sfx} className="p-2">
                      {t ? `${fmt(t.slope)} (${fmt(t.lo)} to ${fmt(t.hi)}) \u00B0C` : ""}
                      <br />
                      <span className="text-sm text-slate-600">{t ? verdictLabel(t) : ""}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>
          Daytime high, 1981 to 2025: falling in {falling} of {ts.length} places. {sigDown} fall and pass the strict test{sigUp ? `, ${sigUp} rise and pass it` : ""}.{steep ? ` Steepest place: ${steep.name}, ${fmt(steep.t.slope)} (${fmt(steep.t.lo)} to ${fmt(steep.t.hi)}) \u00B0C per decade.` : ""}
        </li>
        {steep && (
          <li>
            PMD report (2026) as reported in press: the maximum temperature falls by up to {PMD_SUMMER.toFixed(1)} {"\u00B0C"} per decade in summer and winter in some areas. PMD links part of the decline to extra monsoon cloud, which is PMD's explanation. The steepest NASA place for the summer daytime high, {steep.name}, shows {fmt(steep.t.slope)} {"\u00B0C"}, a {Math.abs(steep.t.slope) > PMD_SUMMER ? "larger" : "smaller"} fall than that figure. A single steepest cell among 38 is a maximum, so its range is a loose guide.
          </li>
        )}
        <li>
          Values are a 50 km reanalysis, not weather stations.
        </li>
      </ul>
    </section>
  );
}

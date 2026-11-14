import { PMD, PMD_SPRING, verdict, verdictLabel } from "./PmdPanel";
import { TwoLines, national } from "./CaseFile1";

type T = { slope: number; lo: number; hi: number; p: number; n: number };
type Nat = Record<string, T>;
type Cell = { name: string; trends: Record<string, (T & { sig: boolean }) | null> };
type Series = Record<string, Record<string, Record<string, number>>>;

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
const VARS = [
  { id: "T2M_MAX", label: "Daytime high" },
  { id: "T2M_MIN", label: "Night time low" },
  { id: "T2M", label: "Average temperature" },
];
const WINDOWS = [
  { sfx: "", label: "1981 to 2025" },
  { sfx: "@1998", label: "1998 to 2025" },
];

export default function CaseFile2({ nat, cells, series }: { nat: Nat; cells: Cell[]; series: Series }) {
  const mx = nat["T2M_MAX|FMA"], mn = nat["T2M_MIN|FMA"];
  if (!mx || !mn) return null;
  const dMax = national(series, "T2M_MAX|FMA");
  const dMin = national(series, "T2M_MIN|FMA");
  const stat = (id: string) => {
    const ts = cells.flatMap((c) => { const t = c.trends[`${id}|FMA`]; return t ? [{ name: c.name, t }] : []; });
    const top = [...ts].sort((a, b) => b.t.slope - a.t.slope)[0];
    return { m: ts.length, up: ts.filter((x) => x.t.slope > 0).length, sig: ts.filter((x) => x.t.sig).length, top };
  };
  const day = stat("T2M_MAX");
  const pmdMax = PMD.find((x) => x.id === "T2M_MAX");
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Case file 2: spring, February to April</h2>
      <p className="mt-1 text-sm text-slate-600">
        How is spring changing, and is it the days or the nights? National average of our 38 grid cells. The chart shows change from each line's own 1981 to 1990 average.
      </p>
      <div className="mt-2 rounded border border-slate-200 p-2">
        <TwoLines
          jump={false}
          label="Feb to Apr daytime high and night time low, national average change since 1981 to 1990"
          lines={[
            { label: "Daytime high", color: "#ea580c", years: dMax.years, vals: dMax.vals, slope: mx.slope },
            { label: "Night time low", color: "#2563eb", years: dMin.years, vals: dMin.vals, slope: mn.slope },
          ]}
        />
        <p className="px-2 text-xs text-slate-600">
          <span style={{ color: "#ea580c" }}>{"\u25A0"}</span> Daytime high <span style={{ color: "#2563eb" }}>{"\u25A0"}</span> Night time low. Feb to Apr values are solid, straight line trends are dashed.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="p-2">Feb to Apr change per decade</th>
              {WINDOWS.map((w) => <th key={w.sfx} className="p-2">{w.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {VARS.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 align-top">
                <td className="p-2">{r.label}</td>
                {WINDOWS.map((w) => {
                  const t = nat[`${r.id}|FMA${w.sfx}`];
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
        {VARS.map((r) => {
          const s = stat(r.id);
          return (
            <li key={r.id}>
              {r.label}, 1981 to 2025: rising in {s.up} of {s.m} places, {s.sig} pass the strict test.{s.top ? ` Steepest place: ${s.top.name}, ${fmt(s.top.t.slope)} (${fmt(s.top.t.lo)} to ${fmt(s.top.t.hi)}) \u00B0C per decade.` : ""}
            </li>
          );
        })}
        {pmdMax && day.top && (
          <li>
            PMD report (Sept 2026) as reported in press: Feb to Apr daytime high up to {PMD_SPRING.toFixed(0)} {"\u00B0C"} per decade in some areas. The steepest NASA place for the daytime high, {day.top.name}, shows {fmt(day.top.t.slope)} {"\u00B0C"}, which is {day.top.t.slope < PMD_SPRING ? "below" : "at or above"} that figure. A single steepest cell among 38 is a maximum, so its range is a loose guide.
          </li>
        )}
        <li>
          National spring changes that pass the test, out of 3: {VARS.filter((r) => nat[`${r.id}|FMA`] && verdict(nat[`${r.id}|FMA`]) === "yes").length} in 1981 to 2025 and {VARS.filter((r) => nat[`${r.id}|FMA@1998`] && verdict(nat[`${r.id}|FMA@1998`]) === "yes").length} in 1998 to 2025. The jump around 1997 seen in the yearly series has an unknown cause, which is why both windows are shown.
        </li>
        <li>
          This page shows what changed, not why. Values are a 50 km reanalysis, not weather stations.
        </li>
      </ul>
    </section>
  );
}

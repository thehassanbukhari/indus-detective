import { PMD, PMD_SPRING, verdict, verdictLabel } from "./PmdPanel";
import { TwoLines, national } from "./CaseFile1";
import { brk, breakKind, breakSentence, CAUSE_NOTE, STEP_FROM, STEP_TO, STEP_DOC, type BreaksFile } from "./breaks";

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

export default function CaseFile2({ nat, cells, series, breaks }: { nat: Nat; cells: Cell[]; series: Series; breaks: BreaksFile }) {
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
  const bMin = brk(breaks, "T2M_MIN|FMA"), bMax = brk(breaks, "T2M_MAX|FMA");
  const kMin = bMin ? breakKind(bMin) : undefined;
  const lateMin = nat["T2M_MIN|FMA@1998"];
  const showStep = kMin === "one" && !!bMin;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Case file 2: spring, February to April</h2>
      <p className="mt-1 text-sm text-slate-600">
        How is spring changing, and is it the days or the nights? National average of our 38 grid cells. Lines show change from each line's own 1981 to 1990 average.
      </p>
      <p className="mt-3 text-base font-semibold text-slate-900">
        Spring night time lows: {fmt(mn.slope)} {"\u00B0C"} per decade, {verdictLabel(mn)}. Spring daytime highs: {fmt(mx.slope)} {"\u00B0C"} per decade, {verdictLabel(mx)}.
      </p>
      <div className="mt-2 rounded border border-slate-200 p-2">
        <TwoLines
          label="Feb to Apr daytime high and night time low, national average change since 1981 to 1990"
          band={showStep ? { from: STEP_FROM, to: STEP_TO, text: `Step window ${STEP_FROM} to ${STEP_TO}` } : undefined}
          lines={[
            { label: "Daytime high", color: "#ea580c", years: dMax.years, vals: dMax.vals, slope: mx.slope },
            { label: "Night time low", color: "#2563eb", years: dMin.years, vals: dMin.vals, slope: mn.slope, levels: true },
          ]}
        />
        <div className="space-y-1 px-2 pb-1 text-sm text-slate-700">
          {showStep && bMin ? (
            <>
              <p>Shaded: the step window, {STEP_FROM} to {STEP_TO}. {bMin.in_1996_1999} of {bMin.cells} places have their spring night low level jump inside it, median {fmt(bMin.median_size)} {"\u00B0C"}. Pale bars: average level before and after. Dashed: straight line trends.</p>
              <p>{STEP_DOC}{lateMin ? ` Since 1998 the spring night low trend is ${fmt(lateMin.slope)} (${fmt(lateMin.lo)} to ${fmt(lateMin.hi)}) \u00B0C per decade, ${verdictLabel(lateMin)}.` : ""}</p>
            </>
          ) : (
            <p>Feb to Apr values are solid, straight line trends are dashed.</p>
          )}
        </div>
      </div>
      <details className="mt-3 rounded border border-slate-200 p-3 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Numbers and checks</summary>
        {bMin && bMax && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>{breakSentence(bMin, "Spring night time low")}</li>
            <li>{breakSentence(bMax, "Spring daytime high")}</li>
            {kMin === "one" && <li>{CAUSE_NOTE}</li>}
          </ul>
        )}
        <div className="mt-3 overflow-x-auto rounded border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-sm text-slate-600">
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
                        <span className="text-sm text-slate-600">{t ? verdictLabel(t) : ""}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
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
              PMD report (2026) as reported in press: Feb to Apr daytime high up to {PMD_SPRING.toFixed(0)} {"\u00B0C"} per decade in some areas. The steepest NASA place for the daytime high, {day.top.name}, shows {fmt(day.top.t.slope)} {"\u00B0C"}, which is {day.top.t.slope < PMD_SPRING ? "below" : "at or above"} that figure. A single steepest cell among 38 is a maximum, so its range is a loose guide.
            </li>
          )}
          <li>
            National spring changes that pass the test, out of 3: {VARS.filter((r) => nat[`${r.id}|FMA`] && verdict(nat[`${r.id}|FMA`]) === "yes").length} in 1981 to 2025 and {VARS.filter((r) => nat[`${r.id}|FMA@1998`] && verdict(nat[`${r.id}|FMA@1998`]) === "yes").length} in 1998 to 2025. Both windows are shown because of the level step near 1997 to 1998.
          </li>
          <li>
            Values are a 50 km reanalysis, not weather stations.
          </li>
        </ul>
      </details>
    </section>
  );
}

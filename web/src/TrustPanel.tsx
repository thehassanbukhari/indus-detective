import { verdict, type Nat } from "./PmdPanel";
import { brk, breakKind, breakSentence, type BreaksFile } from "./breaks";

// Recorded test results (Sat 14 Nov, AGENTS.md section 12): synthetic series, 45 years, truth 0.30 per decade.
export const CHECKS = {
  slopeMean: 0.299, truth: 0.3,
  falsePosNoAuto: 0.052, falsePosAuto: 0.08,
  coverageLo: 81, coverageHi: 87,
};
// Hand check of five cells against the POWER viewer: "pending" | "passed" | "mismatch". T2 report sets this.
export const HAND_CHECK: "pending" | "passed" | "mismatch" = "passed";

type R = { slope: number; lo: number; hi: number; p: number };
export type Grade = "Passes all 3 checks" | "Passes 2 of 3 checks" | "Passes 1 of 3 checks" | "No clear trend over 1981 to 2025";
export function grade(full: R | undefined, late: R | undefined, kind: "one" | "shared" | "none" | undefined, hand = HAND_CHECK): Grade {
  if (!full || verdict(full) !== "yes") return "No clear trend over 1981 to 2025";
  const c2 = !!late && verdict(late) === "yes" && Math.sign(late.slope) === Math.sign(full.slope);
  const c3 = kind === "none";
  if (hand === "mismatch") return "Passes 1 of 3 checks";
  const n = 1 + (c2 ? 1 : 0) + (c3 ? 1 : 0);
  return n === 3 ? "Passes all 3 checks" : n === 2 ? "Passes 2 of 3 checks" : "Passes 1 of 3 checks";
}

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
const short = (t?: R) => (!t ? "" : `${fmt(t.slope)}, ${verdict(t) === "yes" ? "yes" : verdict(t) === "no" ? "no" : "not conclusive"}`);
const VARS = [["T2M_MIN", "Night time low"], ["T2M_MAX", "Daytime high"], ["T2M", "Average temperature"]];
const SEAS = [["annual", "whole year"], ["FMA", "Feb to Apr"]];
const BK = [
  ["T2M_MIN|annual", "Night low, whole year"], ["T2M_MAX|annual", "Daytime high, whole year"], ["T2M|annual", "Average, whole year"],
  ["T2M_MIN|FMA", "Night low, Feb to Apr"], ["T2M_MAX|FMA", "Daytime high, Feb to Apr"],
  ["T2M_MIN|JAS", "Night low, Jul to Sep"], ["T2M_MAX|JAS", "Daytime high, Jul to Sep"],
];

export default function TrustPanel({ nat, breaks }: { nat: Nat; breaks: BreaksFile }) {
  const syn = breaks.synthetic as { false_positive_rate: number } | undefined;
  const handText = HAND_CHECK === "passed" ? "5 places and 30 daily values were compared with NASA\u2019s own Data Access Viewer by team members and again by script. All matched, so our stored numbers are NASA\u2019s numbers. Details are in docs/HAND_CHECK.md." : HAND_CHECK === "mismatch" ? "At least one value did not match the POWER viewer, so every grade below is capped at 1 of 3 checks." : "Under way.";
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">How solid is each finding?</h2>
      <p className="mt-1 text-sm text-slate-600">
        Each national trend gets a grade from a fixed rule, not from opinion. The grade is for the national average of our 38 grid cells, not for single places.
      </p>
      <div className="mt-2 overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr><th className="p-2">Finding</th><th className="p-2">1981 to 2025</th><th className="p-2">1998 to 2025</th><th className="p-2">Break check</th><th className="p-2">Grade</th></tr>
          </thead>
          <tbody>
            {SEAS.flatMap(([s, sl]) => VARS.map(([v, vl]) => {
              const full = nat[`${v}|${s}`], late = nat[`${v}|${s}@1998`], b = brk(breaks, `${v}|${s}`);
              const kind = b ? breakKind(b) : undefined;
              return (
                <tr key={`${v}${s}`} className="border-t border-slate-200 align-top">
                  <td className="p-2">{vl}, {sl}</td>
                  <td className="p-2">{short(full)}</td>
                  <td className="p-2">{short(late)}</td>
                  <td className="p-2">{kind === "one" ? "one jump near 1998" : kind === "shared" ? "shared break year" : kind === "none" ? "no shared break" : "n/a"}</td>
                  <td className="p-2 font-semibold">{grade(full, late, kind)}</td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        <li>Synthetic tests, 45 years with a known slope of {CHECKS.truth.toFixed(2)} per decade: the Theil Sen slope came back at {CHECKS.slopeMean.toFixed(3)} on average. The significance test flagged {(CHECKS.falsePosNoAuto * 100).toFixed(1)} percent of no trend series without autocorrelation and {(CHECKS.falsePosAuto * 100).toFixed(1)} percent with moderate autocorrelation (target 5).</li>
        <li>Interval coverage: the 95 percent ranges contained the true slope in roughly {CHECKS.coverageLo} to {CHECKS.coverageHi} of 100 synthetic runs, so read each range as a minimum.</li>
        <li>Break check: the details below locate level steps in the yearly series and show how many places share each one.{syn ? ` Its own test flags ${(syn.false_positive_rate * 100).toFixed(1)} percent of series with no break, so its p values are descriptive only.` : ""}</li>
        <li>Rainfall is excluded. The source rainfall values were not reliable for trends.</li>
        <li>Ground stations: in NOAA's open daily station archive, the Pakistan night time records usable for trends begin around 2006, so the 1997 to 1998 step is examined inside NASA's data.</li>
        <li>Reanalysis caveat: values come from a computer model (MERRA-2), and trends in reanalysis can be affected by changes in observing systems. Grid cells are not weather stations.</li>
        <li>Hand check against the NASA POWER viewer: {handText}</li>
      </ul>
      <details className="mt-3 rounded border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Break check details</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {BK.map(([k, l]) => { const b = brk(breaks, k); return b ? <li key={k}>{breakSentence(b, l)}</li> : null; })}
        </ul>
      </details>
      <details className="mt-3 rounded border border-slate-200 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">How the grade is decided</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          <li>Check 1: the 1981 to 2025 national trend is statistically significant (range excludes zero and p below 0.05). If not, the grade is No clear trend over 1981 to 2025.</li>
          <li>Check 2: the 1998 to 2025 trend is also significant with the same sign.</li>
          <li>Check 3: the break check shows no shared break year (fewer than 75 percent of places break within 1996 to 1999 and no single year holds 40 percent of places).</li>
          <li>Passes all 3 checks: checks 1, 2 and 3 pass. Passes 2 of 3: check 1 plus check 2 or check 3. Passes 1 of 3: only check 1. A hand check mismatch would cap every grade at 1 of 3.</li>
        </ul>
      </details>
    </section>
  );
}

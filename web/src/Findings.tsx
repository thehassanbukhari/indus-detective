import { PMD, verdict, verdictLabel, type Nat, type Verdict } from "./PmdPanel";

type CellLite = { name: string; trends: Record<string, { slope: number; sig: boolean } | null> };
type Finding = { head: string; lines: string[]; v: Verdict };

const DEG = "\u00B0C";
const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
type R = { slope: number; lo: number; hi: number; p: number };
const per = (t: R) => `${fmt(t.slope)} ${DEG} per decade (95% range ${fmt(t.lo)} to ${fmt(t.hi)})`;

function places(cells: CellLite[], key: string) {
  const rows = cells.flatMap((c) => { const t = c.trends[key]; return t ? [t] : []; });
  const sig = rows.filter((t) => t.sig);
  return { m: rows.length, up: sig.filter((t) => t.slope > 0).length, down: sig.filter((t) => t.slope < 0).length };
}

function head(t: R, subject: string, up: string, down: string) {
  const v = verdict(t);
  if (v === "yes") return t.slope > 0 ? up : down;
  if (v === "inconclusive") return `${subject}: not conclusive nationally.`;
  return `${subject}: no clear national trend.`;
}

export function buildFindings(nat: Nat, cells: CellLite[]): Finding[] {
  const out: Finding[] = [];

  const mn = nat["T2M_MIN|annual"];
  if (mn) {
    const lines = [`National night time low: ${per(mn)}, ${verdictLabel(mn)}.`];
    const sp = nat["T2M_MIN|FMA"];
    if (sp) {
      const pl = places(cells, "T2M_MIN|FMA");
      lines.push(`Feb to Apr nights: ${per(sp)}. ${pl.up} of ${pl.m} places rise and pass the strict test.`);
    }
    const pmd = PMD.find((x) => x.id === "T2M_MIN");
    if (pmd) lines.push(`PMD reports ${fmt(pmd.value)} ${DEG} per decade, ${pmd.value >= mn.lo && pmd.value <= mn.hi ? "inside" : "outside"} the NASA range.`);
    out.push({ head: head(mn, "Night time lows", "Nights are getting warmer.", "Nights are getting cooler."), lines, v: verdict(mn) });
  }

  const mx = nat["T2M_MAX|JAS"];
  if (mx) {
    const pl = places(cells, "T2M_MAX|JAS");
    const h = pl.down > pl.up && pl.down > 0
      ? `Summer daytime highs are falling in ${pl.down} of ${pl.m} places.`
      : "Summer daytime highs: no clear pattern across places.";
    const lines = [
      `Jul to Sep daytime high, national average: ${per(mx)}, ${verdictLabel(mx)}.`,
      `${pl.down} places fall and pass the strict test${pl.up ? `, ${pl.up} rise and pass it` : ""}.`,
    ];
    out.push({ head: h, lines, v: verdict(mx) });
  }

  const g = nat["DTR|JAS"], g98 = nat["DTR|JAS@1998"], lo = nat["T2M_MIN|JAS"];
  if (g) {
    const lines = [`Jul to Sep daytime high minus night time low: ${per(g)}, ${verdictLabel(g)}.`];
    if (g98) lines.push(`Since 1998: ${per(g98)}, ${verdictLabel(g98)}.`);
    if (mx && lo) lines.push(`Jul to Sep daytime highs changed ${fmt(mx.slope)} and night time lows ${fmt(lo.slope)} ${DEG} per decade. The night time low change is ${verdictLabel(lo)}.`);
    out.push({
      head: head(g, "Summer gap between day and night", "In summer the gap between day and night is growing.", "In summer the gap between day and night is shrinking."),
      lines,
      v: verdict(g),
    });
  }

  const m = nat["T2M_MAX|annual"], pm = PMD.find((x) => x.id === "T2M_MAX");
  if (m && pm) {
    const inside = pm.value >= m.lo && pm.value <= m.hi;
    out.push({
      head: inside ? "NASA and PMD are consistent on daytime highs." : "NASA and PMD differ on daytime highs.",
      lines: [
        `PMD reports ${fmt(pm.value)} ${DEG} per decade from ground stations.`,
        `NASA national daytime high: ${per(m)}, ${verdictLabel(m)}.`,
        `The PMD value is ${inside ? "inside" : "outside"} the NASA range. A 50 km reanalysis grid and ground stations measure different things.`,
      ],
      v: verdict(m),
    });
  }
  return out;
}

const VTXT: Record<Verdict, string> = { yes: "statistically significant", inconclusive: "not conclusive", no: "no clear trend" };
const VCLS: Record<Verdict, string> = { yes: "text-teal-800", inconclusive: "text-slate-600", no: "text-slate-600" };
const BAR: Record<Verdict, string> = { yes: "border-teal-600", inconclusive: "border-slate-500", no: "border-slate-300" };

export default function Findings({ nat, cells }: { nat: Nat; cells: CellLite[] }) {
  const items = buildFindings(nat, cells);
  if (!items.length) return null;
  const top = items.slice(0, 2), more = items.slice(2);
  return (
    <section className="mt-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">What NASA data shows</p>
      <div className="mt-3 space-y-5">
        {top.map((f, i) => (
          <div key={i} className={"border-l-4 pl-4 " + BAR[f.v]}>
            <h2 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">{f.head}</h2>
            <p className={"mt-1 text-sm " + VCLS[f.v]}>National average: {VTXT[f.v]}</p>
          </div>
        ))}
      </div>
      {more.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-700">Also found</p>
          <ul className="mt-2 space-y-3">
            {more.map((f, i) => (
              <li key={i}>
                <p className="font-semibold text-slate-900">{f.head}</p>
                <p className={"text-sm " + VCLS[f.v]}>National average: {VTXT[f.v]}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <details className="mt-4 text-sm text-slate-700">
        <summary className="flex min-h-11 cursor-pointer items-center text-teal-700 underline">All the numbers behind these findings</summary>
        <p className="mt-1 text-slate-600">Change per decade, 1981 to 2025, national average of 38 NASA grid cells unless stated.</p>
        <div className="mt-3 space-y-4 tabular-nums">
          {items.map((f, i) => (
            <div key={i}>
              <p className="font-semibold text-slate-900">{f.head}</p>
              {f.lines.map((l, j) => <p key={j} className="mt-1">{l}</p>)}
            </div>
          ))}
        </div>
        <p className="mt-4 text-slate-600">
          The 95% range is the span of changes the data supports. A trend is a straight line fitted through the yearly values. The strict test is the one used when many places are compared at once.
        </p>
      </details>
    </section>
  );
}

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

const BADGE: Record<Verdict, string> = { yes: "statistically significant", inconclusive: "not conclusive", no: "no clear trend" };
const BADGE_CLS: Record<Verdict, string> = {
  yes: "border-teal-300 bg-teal-50 text-teal-900",
  inconclusive: "border-slate-300 bg-slate-100 text-slate-800",
  no: "border-slate-300 bg-white text-slate-700",
};

export default function Findings({ nat, cells }: { nat: Nat; cells: CellLite[] }) {
  const items = buildFindings(nat, cells);
  if (!items.length) return null;
  const lead = items.slice(0, 2).map((f) => f.head).join(" ");
  return (
    <section className="mt-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">What NASA data shows</p>
      <h2 className="mt-2 text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">{lead}</h2>
      <p className="mt-3 text-sm text-slate-600">
        Change per decade, 1981 to 2025, national average of 38 NASA grid cells unless stated.
      </p>
      <ol className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((f, i) => (
          <li key={i} className="py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="font-semibold text-slate-900">{f.head}</p>
              <span className={"rounded-full border px-2.5 py-0.5 text-sm " + BADGE_CLS[f.v]}>National average: {BADGE[f.v]}</span>
            </div>
            <p className="mt-2 text-sm tabular-nums text-slate-700">{f.lines[0]}</p>
            {f.lines.length > 1 && (
              <details className="mt-1 text-sm text-slate-700">
                <summary className="flex min-h-11 cursor-pointer items-center text-teal-700 underline">More numbers</summary>
                <div className="space-y-2 pb-1 tabular-nums">
                  {f.lines.slice(1).map((l, j) => <p key={j}>{l}</p>)}
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-slate-600">
        The 95% range is the span of changes the data supports. A trend is a straight line fitted through the yearly values. The strict test is the one used when many places are compared at once.
      </p>
    </section>
  );
}

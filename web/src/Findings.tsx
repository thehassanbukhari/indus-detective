import { Term, GLOSS } from "./Term";
import { Fold } from "./Disclosure";
import { PMD, verdict, verdictLabel, type Nat, type Verdict } from "./PmdPanel";

type CellLite = { name: string; trends: Record<string, { slope: number; sig: boolean } | null> };
type Finding = { head: string; lines: string[]; v: Verdict; label: string; big: string; unit: string };

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
    out.push({ head: head(mn, "Night time lows", "Nights have warmed since 1981.", "Nights have cooled since 1981."), lines, v: verdict(mn), label: "Night time lows", big: fmt(mn.slope), unit: `${DEG} per decade, national average` });
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
    const falling = pl.down > pl.up && pl.down > 0;
    out.push({ head: h, lines, v: verdict(mx), label: "Summer daytime highs", big: falling ? `${pl.down} of ${pl.m}` : fmt(mx.slope), unit: falling ? "places fall and pass the strict test" : `${DEG} per decade, national average` });
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
      label: "Summer gap between day and night",
      big: fmt(g.slope),
      unit: `${DEG} per decade, July to September`,
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
      label: "NASA and PMD, daytime highs",
      big: `${fmt(pm.value)} and ${fmt(m.slope)}`,
      unit: `${DEG} per decade, PMD and NASA`,
    });
  }
  return out;
}

const VTXT: Record<Verdict, string> = { yes: "statistically significant", inconclusive: "not conclusive", no: "no clear trend" };
const VCLS: Record<Verdict, string> = { yes: "text-teal-800", inconclusive: "text-slate-600", no: "text-slate-600" };
const TOP: Record<Verdict, string> = { yes: "border-t-teal-700", inconclusive: "border-t-slate-500", no: "border-t-slate-300" };

// The opening lines: one question, then what the data says, every number read from the JSON.
export function Hook({ nat, cells }: { nat: Nat; cells: CellLite[] }) {
  const mn = nat["T2M_MIN|annual"];
  const pl = places(cells, "T2M_MAX|JAS");
  const pn = PMD.find((x) => x.id === "T2M_MIN"), px = PMD.find((x) => x.id === "T2M_MAX");
  if (!mn || verdict(mn) !== "yes" || mn.slope <= 0) {
    return <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">How has Pakistan's temperature changed since 1981?</h2>;
  }
  return (
    <div className="mt-4 max-w-2xl">
      <h2 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">Is Pakistan getting hotter? It depends on the time of day.</h2>
      <p className="mt-3 text-lg leading-relaxed text-slate-800">
        In {mn.n} years of daily NASA data for {pl.m} places, nights have warmed by {Math.abs(mn.slope).toFixed(2)} {DEG} per decade, a change that is <Term word="statistically significant">{GLOSS.yes}</Term>.
        {pl.down > pl.up && pl.down > 0 ? ` Summer daytime highs have fallen in ${pl.down} of ${pl.m} places, by enough to pass the same test.` : ""}
        {pn && px && pn.value > px.value ? " Press coverage of the 2026 report from Pakistan\u2019s weather service (PMD) shows nights rising faster than days too." : ""}
      </p>
    </div>
  );
}

const ASKS = [
  { q: "Are nights warming faster than days?", to: "case1" },
  { q: "Is spring getting warmer?", to: "case2" },
  { q: "Are summer days cooling?", to: "case3" },
  { q: "Do NASA and PMD agree?", to: "pmd" },
];

// One tap goes straight to the chart that answers the question.
export function Asks() {
  const go = (id: string) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-700">Start with a question</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ASKS.map((a) => (
          <button key={a.to} type="button" onClick={() => go(a.to)} className="flex min-h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-left text-base text-slate-800 hover:border-teal-600 hover:bg-teal-50">
            {a.q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Findings({ nat, cells }: { nat: Nat; cells: CellLite[] }) {
  const items = buildFindings(nat, cells);
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">What NASA data shows</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((f, i) => (
          <div key={i} className={"flex flex-col rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm " + TOP[f.v]}>
            <p className="text-sm font-semibold text-slate-600">{f.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{f.big}</p>
            <p className="text-sm text-slate-600">{f.unit}</p>
            <p className="mt-3 font-semibold leading-snug text-slate-900">{f.head}</p>
            <p className={"mt-1 text-sm " + VCLS[f.v]}>National average: <Term word={VTXT[f.v]}>{GLOSS[f.v]}</Term></p>
          </div>
        ))}
      </div>
      <Fold title="All the numbers behind these findings">
        <p className="mt-3 text-slate-600">Change per decade, 1981 to 2025, national average of 38 NASA grid cells unless stated.</p>
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
      </Fold>
    </section>
  );
}

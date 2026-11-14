// Reads data/build/breaks.json (Pettitt change point check). All numbers in wording come from that file.
// Pettitt p values ignore autocorrelation, so they are descriptive only and never called significant.
export type Brk = {
  cells: number; sig_cells: number; median_year: number; q25: number; q75: number;
  in_1996_1999: number; median_size: number;
  national: { year: number; size: number; p: number };
  top_years: [number, number][];
};
export type BreaksFile = Record<string, unknown>;
export const brk = (b: BreaksFile, key: string): Brk | undefined => (key === "synthetic" ? undefined : (b[key] as Brk | undefined));

// Closed rule (AGENTS.md section 12): "one" = at least 75 percent of places break within 1996 to 1999,
// "shared" = otherwise the most common break year holds at least 40 percent of places, else "none".
export type BreakKind = "one" | "shared" | "none";
export const breakKind = (k: Brk): BreakKind =>
  k.in_1996_1999 / k.cells >= 0.75 ? "one" : k.top_years[0][1] / k.cells >= 0.4 ? "shared" : "none";

const fmt = (x: number) => (x >= 0 ? "+" : "\u2212") + Math.abs(x).toFixed(2);
export const pFmt = (p: number) => (p < 0.001 ? "below 0.001" : p.toFixed(3));

export function breakSentence(k: Brk, what: string): string {
  const [ty, tc] = k.top_years[0];
  const nat = `National average jump ${fmt(k.national.size)} \u00B0C at ${k.national.year} (Pettitt p ${pFmt(k.national.p)}, descriptive only).`;
  const kind = breakKind(k);
  if (kind === "one")
    return `${what}: ${k.in_1996_1999} of ${k.cells} places have their level jump within 1996 to 1999, most often ${ty} (${tc} places). Median jump ${fmt(k.median_size)} \u00B0C. ${nat}`;
  if (kind === "shared")
    return `${what}: no jump in 1996 to 1999 dominates, but ${tc} of ${k.cells} places break in ${ty}. Median jump ${fmt(k.median_size)} \u00B0C. ${nat}`;
  return `${what}: no shared break year (most common ${ty}, ${tc} of ${k.cells} places). ${nat}`;
}

export const CAUSE_NOTE =
  "The same jump year in nearly every place fits a change in the data source or observing system, and it also fits a real regional shift. The cause is not claimed and is not verified.";

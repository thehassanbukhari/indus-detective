import { useState, type ReactNode } from "react";

export const GLOSS = {
  grid: "one square of NASA's computer model map, about 50 km wide",
  range: "the span of changes the data supports",
  reanalysis: "a computer model that blends many observations into one complete record",
  jump: "a sudden step in the yearly values, not a slow trend",
  breakCheck: "a test that looks for the year when a series suddenly shifts level",
  yes: "bigger than the normal year to year ups and downs, even after allowing for testing many places",
  inconclusive: "the range of likely changes excludes zero, but the change fails the strict test used when many places are compared at once",
  no: "the change could be natural variation",
};

// A hard word that opens its plain meaning in place when tapped.
export function Term({ word, children }: { word: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="cursor-help underline decoration-teal-700 decoration-dotted underline-offset-4">{word}</button>
      {open && <span className="mx-1 rounded bg-teal-50 px-1.5 py-0.5 text-sm text-teal-900">({children})</span>}
    </>
  );
}

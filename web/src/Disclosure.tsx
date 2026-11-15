import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "concise" | "extended";
export const ModeContext = createContext<Mode>("concise");

// A folded section with a clear cue: a bordered bar with Show or Hide and a turning arrow. Extended mode opens every one.
export function Fold({ title, children }: { title: string; children: ReactNode }) {
  const ext = useContext(ModeContext) === "extended";
  const [open, setOpen] = useState(ext);
  useEffect(() => { setOpen(ext); }, [ext]);
  return (
    <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 text-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-left text-base font-semibold text-slate-900 hover:bg-slate-100">
        <span>{title}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-teal-800">
          {open ? "Hide" : "Show"}
          <svg viewBox="0 0 20 20" aria-hidden="true" className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")}>
            <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && <div className="rounded-b-lg border-t border-slate-200 bg-white px-3 pb-3 text-slate-700">{children}</div>}
    </div>
  );
}

const OPTS: { id: Mode; label: string }[] = [{ id: "concise", label: "Concise" }, { id: "extended", label: "Extended" }];

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mt-3 border-y border-slate-200 bg-white/95 px-4 py-1.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <span id="view-label" className="text-sm font-semibold text-slate-700">View</span>
        <div role="group" aria-labelledby="view-label" className="inline-flex rounded-full border border-slate-300 bg-slate-100 p-0.5">
          {OPTS.map((o) => (
            <button key={o.id} type="button" aria-pressed={mode === o.id} onClick={() => onChange(o.id)} className={"min-h-11 rounded-full px-5 text-base font-semibold " + (mode === o.id ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-white")}>
              {o.label}
            </button>
          ))}
        </div>
        <span className="hidden text-sm text-slate-600 sm:inline">{mode === "concise" ? "Key findings, numbers folded away." : "Every number and plain meaning is open."}</span>
      </div>
    </div>
  );
}

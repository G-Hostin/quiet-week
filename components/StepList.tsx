import type { Step } from "@/lib/types";

export const STEP_LABEL: Record<Step["kind"], string> = {
  search: "Search",
  check: "Check",
  swap: "Swap",
  measure: "Measure",
  compute: "Compute",
  write: "Write",
  warn: "Note",
  think: "Plan",
  done: "Done",
};

/** The agent's journal: one line per tool call, with its time. */
export default function StepList({ steps, live = false }: { steps: Step[]; live?: boolean }) {
  return (
    <ol className={`steps ${live ? "is-live" : ""}`} aria-live={live ? "polite" : undefined}>
      {steps.map((s, i) => (
        <li key={i} className={`step step-${s.kind}`}>
          <span className="step-t num">{(s.ms / 1000).toFixed(1)}s</span>
          <span className="step-k">{STEP_LABEL[s.kind]}</span>
          <span className="step-x">
            {s.text}
            {s.detail && <span className="step-d">{s.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

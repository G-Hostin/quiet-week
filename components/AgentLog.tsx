import type { Analysis, Step } from "@/lib/types";

export const STEP_LABEL: Record<Step["kind"], string> = {
  search: "Search",
  check: "Check",
  swap: "Stand-in",
  measure: "Measure",
  compute: "Compute",
  write: "Write",
  warn: "Note",
  think: "Agent",
  done: "Done",
};

export function StepList({ steps, live = false }: { steps: Step[]; live?: boolean }) {
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

export default function AgentLog({ analysis }: { analysis: Analysis }) {
  const a = analysis;
  const st = a.stats;
  return (
    <details className="ev card">
      <summary><h3>What the agent did ({a.steps.length} steps)</h3></summary>
      <p className="small muted">
        {a.mode === "example" ? "Recorded when this example was precomputed. " : ""}
        {st.geminiCalls
          ? `Gemini (${st.model}) called the tools ${st.geminiCalls} times. `
          : "The fixed pipeline ran the tools without the language model. "}
        {st.qlooCalls + st.qlooCached} Qloo calls ({st.qlooCached} from cache), {st.seconds}s. The model only ever saw game and
        film titles, dates and Qloo numbers.
      </p>
      <StepList steps={a.steps} />
    </details>
  );
}

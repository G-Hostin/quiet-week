import { phaseReached } from "@/lib/present";
import type { Step, StepKind } from "@/lib/types";
import StepList from "../StepList";
import { Check } from "../Icons";

const PHASES: Record<"resolve" | "analyze", { label: string; kinds: StepKind[] }[]> = {
  resolve: [
    { label: "Searching Qloo for your games", kinds: ["search", "think"] },
    { label: "Checking that Qloo has audience data for them", kinds: ["check", "warn"] },
    { label: "Getting the matches ready for you", kinds: ["done"] },
  ],
  analyze: [
    { label: "Reading the release calendar", kinds: ["think", "search"] },
    { label: "Scoring every game and film with Qloo", kinds: ["measure", "swap", "warn"] },
    { label: "Colouring the weeks", kinds: ["compute"] },
    { label: "Writing your verdict", kinds: ["write", "done"] },
  ],
};

/** What the agent is doing right now: a plain checklist first, the raw tool calls underneath. */
export default function AgentWorking({ kind, steps }: { kind: "resolve" | "analyze"; steps: Step[] }) {
  const phases = PHASES[kind];
  const reached = phaseReached(steps, phases.map((p) => p.kinds));
  // The current phase is the furthest reached; until the first step arrives, the first one is in progress.
  const current = Math.max(0, reached);
  return (
    <div className="stage panel working" aria-busy="true" aria-labelledby="step-title">
      <div className="stage-head">
        <h2 id="step-title" tabIndex={-1}>
          {kind === "resolve" ? "Finding your games in Qloo" : "Measuring your launch window"}
        </h2>
        <p>
          {kind === "resolve"
            ? "An AI agent is searching Qloo for the games you named. Usually 5 to 20 seconds."
            : "The agent is scoring every big release in your window against your players. Usually 15 to 30 seconds."}
        </p>
      </div>
      <ol className="phases">
        {phases.map((p, i) => {
          const state = i < current ? "is-done" : i === current ? "is-now" : "is-todo";
          return (
            <li key={p.label} className={`phase ${state}`}>
              <span className="phase-i" aria-hidden="true">
                {state === "is-done" ? <Check size={13} /> : state === "is-now" ? <span className="spin" /> : null}
              </span>
              <span>
                {p.label}
                <span className="sr-only">{state === "is-done" ? " (done)" : state === "is-now" ? " (in progress)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="log">
        <p className="log-title">
          Live log <span className="muted">Each line is a real call made by the agent.</span>
        </p>
        {steps.length ? <StepList steps={steps} live /> : <p className="small muted">Starting…</p>}
      </div>
    </div>
  );
}

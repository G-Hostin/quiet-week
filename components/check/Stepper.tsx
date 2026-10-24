import { Check } from "../Icons";

const STEPS = ["Your game", "Confirm the matches", "Your weeks"];

/** Progress through the three steps. A progress indicator, not a control: drawn in ink, never in the action colour. */
export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="stepper" aria-label="Steps">
      {STEPS.map((s, i) => {
        const state = i < current ? "is-done" : i === current ? "is-current" : "is-todo";
        return (
          <li key={s} className={`stepper-i ${state}`} aria-current={i === current ? "step" : undefined}>
            <span className="stepper-n" aria-hidden="true">
              {i < current ? <Check size={14} /> : i + 1}
            </span>
            <span className="stepper-l">
              <span className="sr-only">Step {i + 1}: </span>
              {s}
              {i < current && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

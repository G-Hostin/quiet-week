"use client";

import { ArrowRight } from "../Icons";

export interface FormState {
  name: string;
  pitch: string;
  titles: string[];
  from: string;
  to: string;
}

export const MONTHS: [string, string][] = [
  ["2026-11", "Nov 2026"],
  ["2026-12", "Dec 2026"],
  ["2027-01", "Jan 2027"],
  ["2027-02", "Feb 2027"],
  ["2027-03", "Mar 2027"],
];

const PLACEHOLDERS = ["Stardew Valley", "Spiritfarer", "A Short Hike"];

/** Step 1: the games whose players look like yours, and the launch window. */
export default function StepGame(props: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const f = props.form;
  const set = (patch: Partial<FormState>) => props.onChange({ ...f, ...patch });
  return (
    <form
      className="stage panel"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
      aria-labelledby="step-title"
      noValidate
    >
      <div className="stage-head">
        <h2 id="step-title" tabIndex={-1}>Which games do your players love?</h2>
        <p>
          Name 1 to 3 well-known games whose players look like yours. Qloo has little data on small games, so these
          stand in for your audience.
        </p>
      </div>

      <fieldset className="fgroup">
        <legend className="flabel">Games like yours</legend>
        <div className="titles">
          {f.titles.map((t, i) => (
            <label key={i} className="field">
              <span className="field-l">
                Game {i + 1} {i === 0 ? <span className="req">(required)</span> : <span className="opt">(optional)</span>}
              </span>
              <input
                value={t}
                maxLength={80}
                placeholder={`e.g. ${PLACEHOLDERS[i]}`}
                autoComplete="off"
                required={i === 0}
                aria-invalid={i === 0 && !!props.error && !t.trim() ? true : undefined}
                onChange={(e) => set({ titles: f.titles.map((x, j) => (j === i ? e.target.value : x)) })}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="fgroup">
        <legend className="flabel">When do you want to launch?</legend>
        <div className="window">
          <label className="field">
            <span className="field-l">From</span>
            <select value={f.from} onChange={(e) => set({ from: e.target.value })}>
              {MONTHS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-l">To</span>
            <select value={f.to} onChange={(e) => set({ to: e.target.value })}>
              {MONTHS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">Quiet Week tracks the big releases from November 2026 to March 2027.</p>
      </fieldset>

      <fieldset className="fgroup">
        <legend className="flabel">
          About your game <span className="opt">(optional)</span>
        </legend>
        <div className="about">
          <label className="field">
            <span className="field-l">Name</span>
            <input value={f.name} maxLength={60} placeholder="e.g. Lantern Keeper" autoComplete="off" onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-l">One sentence about it</span>
            <input
              value={f.pitch}
              maxLength={240}
              placeholder="e.g. A cozy lighthouse sim by the sea."
              autoComplete="off"
              aria-describedby="pitch-hint"
              onChange={(e) => set({ pitch: e.target.value })}
            />
          </label>
        </div>
        <p className="hint" id="pitch-hint">Only shown on your result. Never sent to the AI model.</p>
      </fieldset>

      {props.error && (
        <p className="notice" role="alert">
          {props.error}
        </p>
      )}

      <div className="stage-actions">
        <button className="btn" type="submit">
          Find these games in Qloo <ArrowRight size={16} />
        </button>
        <p className="hint">Usually 5 to 20 seconds. You confirm the matches before anything is measured.</p>
      </div>
    </form>
  );
}

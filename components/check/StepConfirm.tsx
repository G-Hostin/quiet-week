"use client";

import type { SearchHit } from "@/lib/qloo-ops";
import type { Step } from "@/lib/types";
import Cover from "../Cover";
import StepList from "../StepList";
import { ArrowLeft, ArrowRight, Check } from "../Icons";

export interface Match {
  typed: string;
  candidates: SearchHit[];
  pickedId: string | null;
  note: string;
  audienceData: boolean | null;
}

/** Step 2: the user confirms each game the agent found. Nothing is measured before this. */
export default function StepConfirm(props: {
  matches: Match[];
  picked: Record<number, string | null>;
  steps: Step[];
  error: string | null;
  onPick: (i: number, id: string | null) => void;
  onBack: () => void;
  onGo: () => void;
}) {
  const count = Object.values(props.picked).filter(Boolean).length;
  return (
    <div className="stage" aria-labelledby="step-title">
      <div className="stage-head">
        <h2 id="step-title" tabIndex={-1}>Are these the right games?</h2>
        <p>Qloo search can pick the wrong title. Check each one, or skip it.</p>
      </div>

      {props.matches.map((m, i) => (
        <fieldset key={i} className="match">
          <legend className="match-l">
            You typed <strong>“{m.typed}”</strong>
          </legend>
          {m.note && <p className="match-note">Agent&apos;s note: {m.note}</p>}
          {m.audienceData === false && props.picked[i] === m.pickedId && m.pickedId && (
            <p className="match-warn">Qloo has no audience data for this game. Pick another one or skip it.</p>
          )}
          <div className="cands">
            {m.candidates.slice(0, 4).map((c) => {
              const on = props.picked[i] === c.id;
              return (
                <label key={c.id} className={`cand ${on ? "is-on" : ""}`}>
                  <input className="cand-input" type="radio" name={`match-${i}`} checked={on} onChange={() => props.onPick(i, c.id)} />
                  <Cover src={c.image} name={c.name} w={34} h={44} />
                  <span className="cand-text">
                    <span className="cand-name">{c.name}</span>
                    <span className="cand-meta">{[c.releaseDate?.slice(0, 4), c.developer].filter(Boolean).join(", ")}</span>
                  </span>
                  <span className="cand-tick" aria-hidden="true">{on && <Check size={13} />}</span>
                </label>
              );
            })}
            <label className={`cand cand-skip ${props.picked[i] === null ? "is-on" : ""}`}>
              <input className="cand-input" type="radio" name={`match-${i}`} checked={props.picked[i] === null} onChange={() => props.onPick(i, null)} />
              <span className="cand-text">
                <span className="cand-name">{m.candidates.length ? "None of these" : "Not found in Qloo"}</span>
                <span className="cand-meta">Skip this game</span>
              </span>
              <span className="cand-tick" aria-hidden="true">{props.picked[i] === null && <Check size={13} />}</span>
            </label>
          </div>
        </fieldset>
      ))}

      {props.error && (
        <p className="notice" role="alert">
          {props.error}
        </p>
      )}

      <div className="stage-actions">
        <button type="button" className="btn btn-quiet" onClick={props.onBack}>
          <ArrowLeft size={16} /> Change games
        </button>
        <button type="button" className="btn" onClick={props.onGo} disabled={!count}>
          Measure my launch window <ArrowRight size={16} />
        </button>
        <p className="hint">
          {count ? `Your players will be described by ${count} game${count === 1 ? "" : "s"}.` : "Pick at least one game."}
        </p>
      </div>

      {props.steps.length > 0 && (
        <details className="more">
          <summary>What the agent did to find them ({props.steps.length} steps)</summary>
          <StepList steps={props.steps} />
        </details>
      )}
    </div>
  );
}

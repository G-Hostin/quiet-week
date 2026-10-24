"use client";

import type { SearchHit } from "@/lib/qloo-ops";
import Cover from "./Cover";

export interface Match {
  typed: string;
  candidates: SearchHit[];
  pickedId: string | null;
  note: string;
  audienceData: boolean | null;
}

export default function MatchPicker(props: {
  matches: Match[];
  picked: Record<number, string | null>;
  onPick: (i: number, id: string | null) => void;
  onBack: () => void;
  onGo: () => void;
}) {
  const count = Object.values(props.picked).filter(Boolean).length;
  return (
    <div className="confirm">
      <p>Is this the game you meant? Qloo search can pick the wrong title, so please check each one.</p>
      {props.matches.map((m, i) => (
        <fieldset key={i} className="match">
          <legend>
            You typed <strong>“{m.typed}”</strong>
          </legend>
          {m.note && <p className="small muted match-note">Agent: {m.note}</p>}
          {m.audienceData === false && props.picked[i] === m.pickedId && (
            <p className="small warn-text">Qloo has no audience data for this game. Pick another one or skip it.</p>
          )}
          <div className="cands" role="radiogroup" aria-label={`Matches for ${m.typed}`}>
            {m.candidates.slice(0, 4).map((c) => (
              <label key={c.id} className={`cand ${props.picked[i] === c.id ? "is-on" : ""}`}>
                <input type="radio" name={`m${i}`} checked={props.picked[i] === c.id} onChange={() => props.onPick(i, c.id)} />
                <Cover src={c.image} name={c.name} w={32} h={42} />
                <span>
                  <span className="cand-name">{c.name}</span>
                  <span className="tiny muted">{[c.releaseDate?.slice(0, 4), c.developer].filter(Boolean).join(", ")}</span>
                </span>
              </label>
            ))}
            <label className={`cand cand-skip ${props.picked[i] === null ? "is-on" : ""}`}>
              <input type="radio" name={`m${i}`} checked={props.picked[i] === null} onChange={() => props.onPick(i, null)} />
              <span>Skip this one</span>
            </label>
          </div>
        </fieldset>
      ))}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={props.onBack}>Search again</button>
        <button type="button" className="btn" onClick={props.onGo} disabled={!count}>
          Measure against {count} game{count === 1 ? "" : "s"}
        </button>
      </div>
    </div>
  );
}

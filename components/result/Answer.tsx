"use client";

import { longDate, shortDate } from "@/lib/dates";
import { answerFor, answerLede, weekReason } from "@/lib/present";
import type { Analysis, Pick } from "@/lib/types";
import { ChevronRight } from "../Icons";
import ScoreScale from "./ScoreScale";

function WeekRow({ p, kind, a, onShow }: { p: Pick; kind: "pick" | "avoid"; a: Analysis; onShow: (s: string) => void }) {
  const [mon, day] = shortDate(p.weekStart).split(" ");
  const why = weekReason(p, a, kind);
  return (
    <li>
      <button type="button" className={`wrow lvl-${p.level}`} onClick={() => onShow(p.weekStart)}>
        <span className="wrow-date" aria-hidden="true">
          <span className="wrow-mon">{mon}</span>
          <span className="wrow-day num">{day}</span>
        </span>
        <span className="wrow-body">
          <span className="wrow-title">
            Week of {longDate(p.weekStart).replace(/, \d{4}$/, "")}
          </span>
          <span className="wrow-why">
            <span className="dot" aria-hidden="true" /> {why.text}
          </span>
        </span>
        <span className="wrow-go">
          <span className="wrow-go-t">See this week</span>
          <ChevronRight size={16} />
        </span>
      </button>
    </li>
  );
}

/** The answer, first: one sentence, the GTA VI number on its scale, the best weeks and the weeks to avoid. */
export default function Answer({ analysis, onShowWeek }: { analysis: Analysis; onShowWeek: (s: string) => void }) {
  const a = analysis;
  const ans = answerFor(a);
  const lede = answerLede(a);
  const g = a.verdict.gta;
  const gtaRel = a.releases.find((r) => r.key === "gta6");
  return (
    <section className="answer" id="answer" aria-labelledby="answer-title">
      <div className="band-dark answer-band">
      <div className="wrap answer-top">
        <div className="answer-say">
          {gtaRel && <p className="answer-q">Should you move your launch away from GTA VI?</p>}
          <h1 id="answer-title" className={`answer-a tone-${ans.tone}`} tabIndex={-1}>
            {ans.text}
          </h1>
          {lede.map((s, i) => (
            <p key={i} className="answer-lede">{s}</p>
          ))}
        </div>
        {gtaRel && g.affinity !== null && (
          <div className="answer-gauge">
            <p className="gauge-l">
              GTA VI player overlap <span className="muted">(0 to 1)</span>
            </p>
            <ScoreScale rule={a.evidence.rule} value={g.affinity} level={gtaRel.level} label="GTA VI player overlap" />
            <p className="gauge-note">
              {g.standInTitle ? <>Measured through {g.standInTitle}: Qloo cannot score GTA VI before it launches. </> : null}
              <a href="#how-to-read">How to read this</a>
            </p>
          </div>
        )}
      </div>
      </div>

      <div className="band-work answer-weeks-band">
      <div className="wrap answer-weeks">
        <div className="wlist">
          <h2 className="wlist-h">
            <span className="wlist-mark is-pick" aria-hidden="true" /> Best weeks to launch
          </h2>
          <ul>
            {a.verdict.recommended.map((p) => (
              <WeekRow key={p.weekStart} p={p} kind="pick" a={a} onShow={onShowWeek} />
            ))}
          </ul>
        </div>
        <div className="wlist">
          <h2 className="wlist-h">
            <span className="wlist-mark is-avoid" aria-hidden="true" /> Weeks to avoid
          </h2>
          <ul>
            {a.verdict.avoid.map((p) => (
              <WeekRow key={p.weekStart} p={p} kind="avoid" a={a} onShow={onShowWeek} />
            ))}
          </ul>
          <p className="wlist-foot small muted">Weeks start on Monday. Dates are North American launch days.</p>
        </div>
      </div>
      </div>
    </section>
  );
}

import { longDate, shortDate } from "@/lib/dates";
import { aff } from "@/lib/format";
import type { Analysis, Pick } from "@/lib/types";

const ANSWER: Record<string, string> = { yes: "Yes, dodge it", maybe: "Maybe", no: "No need to run", unknown: "No score" };

function PickRow({ p, kind, onShowWeek }: { p: Pick; kind: "pick" | "avoid"; onShowWeek: (s: string) => void }) {
  return (
    <li className={`vrow vrow-${kind} lvl-${p.level}`}>
      <button type="button" className="vrow-week" onClick={() => onShowWeek(p.weekStart)} aria-label={`Show the week of ${longDate(p.weekStart)} in the calendar`}>
        <span className="vrow-mon">{shortDate(p.weekStart).split(" ")[0]}</span>
        <span className="vrow-day num">{shortDate(p.weekStart).split(" ")[1]}</span>
      </button>
      <p className="vrow-text">{p.sentence}</p>
    </li>
  );
}

export default function Verdict({ analysis, onShowWeek }: { analysis: Analysis; onShowWeek: (s: string) => void }) {
  const v = analysis.verdict;
  const g = v.gta;
  const gtaRel = analysis.releases.find((r) => r.key === "gta6");
  return (
    <section className="section" id="verdict" aria-labelledby="verdict-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="verdict-title">The verdict</h2>
          <p className="muted">Week starts are Mondays. Dates are where each release lands in North America.</p>
        </div>
        <div className="verdict-grid">
          <div className={`gta card gta-${g.answer}`}>
            <p className="gta-q">Should you dodge GTA VI?</p>
            <p className="gta-a">{ANSWER[g.answer]}</p>
            <p className="gta-num num">{aff(g.affinity)}</p>
            <p className="small">
              Qloo affinity between your players and {g.standInTitle ? <>GTA VI, measured through <strong>{g.standInTitle}</strong></> : "GTA VI"}
              {g.rank ? <>, #{g.rank} of {g.of} games tracked</> : null}.
            </p>
            {gtaRel && (
              <p className="tiny muted">
                Out {longDate(gtaRel.date)}.{" "}
                <a href={gtaRel.source.url} target="_blank" rel="noopener noreferrer">{gtaRel.source.publisher}</a>
              </p>
            )}
          </div>
          <div className="verdict-lists card">
            <div className="vlist">
              <h3>Three weeks that look quiet for you</h3>
              <ul>{v.recommended.map((p) => <PickRow key={p.weekStart} p={p} kind="pick" onShowWeek={onShowWeek} />)}</ul>
            </div>
            <div className="vlist">
              <h3>Two weeks to avoid</h3>
              <ul>{v.avoid.map((p) => <PickRow key={p.weekStart} p={p} kind="avoid" onShowWeek={onShowWeek} />)}</ul>
            </div>
          </div>
        </div>
        <div className="summary card">
          <p className="summary-text">{v.summary}</p>
          <p className="tiny muted">
            {v.summaryBy === "agent"
              ? "Written by the Gemini agent from the Qloo numbers above; a check rejects any number, date or sales claim the tools did not return."
              : "Assembled from the Qloo numbers above."}
          </p>
        </div>
      </div>
    </section>
  );
}

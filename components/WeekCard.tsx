import { longDate, shortDate } from "@/lib/dates";
import { aff, hostOf, kindLabel, LEVEL_TEXT } from "@/lib/format";
import type { Analysis, ScoredRelease, SteamEvent, Week } from "@/lib/types";

function Row({ r }: { r: ScoredRelease }) {
  return (
    <li className={`rel lvl-${r.level}`}>
      <div className="rel-score num" aria-label={`Affinity ${aff(r.affinity)}`}>
        <span className="rel-dot" aria-hidden="true" />
        {aff(r.affinity)}
      </div>
      <div className="rel-body">
        <p className="rel-title">
          {r.title} <span className="muted small">{kindLabel(r.kind)}, {shortDate(r.date)}</span>
        </p>
        <p className="small muted">
          {r.via === "stand-in" && r.standIn ? (
            <>
              Measured through <strong className="standin">{r.standIn.title}</strong>, stand-in: {r.standIn.reason}
            </>
          ) : r.via === "own" ? (
            <>Qloo scores this {r.kind === "game" ? "game" : "film"} itself.</>
          ) : (
            <>Qloo has no score for this release or its stand-in.</>
          )}
          {r.rank && r.kind === "game" ? ` Rank #${r.rank} among scored games.` : ""}
        </p>
        <p className="tiny">
          Date: <a href={r.source.url} target="_blank" rel="noopener noreferrer">{r.source.publisher}</a>{" "}
          <span className="muted">({hostOf(r.source.url)}, checked {shortDate(r.verifiedOn)})</span>
        </p>
      </div>
    </li>
  );
}

export default function WeekCard(props: { week: Week; analysis: Analysis; steamEvents: SteamEvent[] }) {
  const { week, analysis } = props;
  const byKey = new Map(analysis.releases.map((r) => [r.key, r]));
  const rels = week.releaseKeys.map((k) => byKey.get(k)!).filter(Boolean);
  rels.sort((x, y) => (y.affinity ?? -1) - (x.affinity ?? -1));
  const events = week.steamEvents.map((k) => props.steamEvents.find((e) => e.key === k)).filter(Boolean) as SteamEvent[];
  const pick = analysis.verdict.recommended.find((p) => p.weekStart === week.start);
  const avoid = analysis.verdict.avoid.find((p) => p.weekStart === week.start);

  return (
    <div className={`weekcard lvl-${week.level}`} aria-live="polite">
      <div className="weekcard-head">
        <div>
          <h3>
            Week of {longDate(week.start)}
          </h3>
          <p className="small muted">{shortDate(week.start)} to {shortDate(week.end)}</p>
        </div>
        <span className={`pill lvl-${week.level}`}>{LEVEL_TEXT[week.level]}</span>
      </div>
      {(pick || avoid) && (
        <p className={`weekcard-note ${pick ? "is-pick" : "is-avoid"}`}>
          <strong>{pick ? "Recommended." : "Avoid."}</strong> {(pick || avoid)!.sentence}
        </p>
      )}
      {rels.length === 0 ? (
        <p className="muted">No tracked game or film releases this week.</p>
      ) : (
        <ul className="rels">{rels.map((r) => <Row key={r.key} r={r} />)}</ul>
      )}
      {events.length > 0 && (
        <ul className="events small">
          {events.map((e) => (
            <li key={e.key}>
              <i className="mark-steam" aria-hidden="true" /> <strong>{e.title}</strong>, {shortDate(e.start)} to {shortDate(e.end)}: new releases get little visibility on Steam.{" "}
              <a href={e.source.url} target="_blank" rel="noopener noreferrer">{e.source.publisher}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

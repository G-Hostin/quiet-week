import { weightOf } from "@/lib/calendar";
import { longDate, shortDate } from "@/lib/dates";
import { hostOf, kindLabel, LEVEL_TEXT, scoreText } from "@/lib/format";
import type { Analysis, ScoredRelease, SteamEvent, Week } from "@/lib/types";
import { ChevronLeft, ChevronRight, External } from "../Icons";

function Row({ r }: { r: ScoredRelease }) {
  return (
    <li className={`rel lvl-${r.level}`}>
      <p className="rel-score num">
        <span className="dot" aria-hidden="true" />
        <span>
          <span className="sr-only">Player overlap </span>
          {scoreText(r)}
        </span>
      </p>
      <div className="rel-body">
        <p className="rel-title">
          {r.title} <span className="rel-kind">{kindLabel(r.kind)}, out {shortDate(r.date)}</span>
        </p>
        <p className="rel-how">
          {r.via === "named" ? (
            <>
              It continues <strong>{r.namedAs}</strong>, one of the games you named, so its players are yours. Qloo
              leaves the games you name out of its own results, so there is no number here: the week counts as red.
            </>
          ) : r.via === "stand-in" && r.standIn ? (
            <>
              Measured through <strong>{r.standIn.title}</strong>. {r.standIn.reason}
            </>
          ) : r.via === "own" ? (
            <>Qloo scores this {r.kind === "game" ? "game" : "film"} directly.</>
          ) : (
            <>Qloo has no score for this release or for an earlier one, so it does not colour the week.</>
          )}
        </p>
        <p className="rel-src">
          Date source:{" "}
          <a href={r.source.url} target="_blank" rel="noopener noreferrer">
            {r.source.publisher}
            <External size={12} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{" "}
          <span className="muted">
            {hostOf(r.source.url)}, checked {shortDate(r.verifiedOn)}
          </span>
        </p>
      </div>
    </li>
  );
}

/** Details of the week selected in the calendar. Information only, apart from the previous/next buttons. */
export default function WeekDetail(props: {
  week: Week;
  analysis: Analysis;
  steamEvents: SteamEvent[];
  prev: string | null;
  next: string | null;
  onSelect: (s: string) => void;
}) {
  const { week, analysis } = props;
  const byKey = new Map(analysis.releases.map((r) => [r.key, r]));
  const rels = week.releaseKeys.map((k) => byKey.get(k)!).filter(Boolean);
  rels.sort((x, y) => (weightOf(y) ?? -1) - (weightOf(x) ?? -1));
  const events = week.steamEvents.map((k) => props.steamEvents.find((e) => e.key === k)).filter(Boolean) as SteamEvent[];
  const pick = analysis.verdict.recommended.find((p) => p.weekStart === week.start);
  const avoid = analysis.verdict.avoid.find((p) => p.weekStart === week.start);

  return (
    <div className={`wd lvl-${week.level}`} id="week-detail">
      <div className="wd-head">
        <div className="wd-title">
          <h3>Week of {longDate(week.start)}</h3>
          <p className="small muted">
            Monday {shortDate(week.start)} to Sunday {shortDate(week.end)}
          </p>
        </div>
        <span className={`pill lvl-${week.level}`}>
          <span className="dot" aria-hidden="true" />
          {LEVEL_TEXT[week.level]}
        </span>
        <div className="wd-nav">
          <button type="button" className="btn btn-sm btn-quiet" disabled={!props.prev} onClick={() => props.prev && props.onSelect(props.prev)}>
            <ChevronLeft size={15} /> <span className="wd-nav-t">Previous</span>
            <span className="sr-only"> week</span>
          </button>
          <button type="button" className="btn btn-sm btn-quiet" disabled={!props.next} onClick={() => props.next && props.onSelect(props.next)}>
            <span className="wd-nav-t">Next</span>
            <span className="sr-only"> week</span> <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {(pick || avoid) && (
        <p className={`wd-verdict ${pick ? "is-pick" : "is-avoid"}`}>
          <strong>{pick ? "One of your best weeks." : "A week to avoid."}</strong> {(pick || avoid)!.sentence}
        </p>
      )}

      {rels.length === 0 ? (
        <p className="wd-empty">No big game or film that we track launches this week.</p>
      ) : (
        <ul className="rels">
          {rels.map((r) => (
            <Row key={r.key} r={r} />
          ))}
        </ul>
      )}

      {events.length > 0 && (
        <ul className="wd-events">
          {events.map((e) => (
            <li key={e.key}>
              <strong>{e.title}</strong>, {shortDate(e.start)} to {shortDate(e.end)}: new releases get little visibility on
              Steam during storewide events.{" "}
              <a href={e.source.url} target="_blank" rel="noopener noreferrer">
                {e.source.publisher}
                <External size={12} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { shortDate } from "@/lib/dates";
import type { RuleConfig } from "@/lib/types";
import ScoreScale from "./ScoreScale";

/** The one place that explains the score, the colours and the limits. */
export default function HowToRead({ rule, calendarUpdated }: { rule: RuleConfig; calendarUpdated: string }) {
  return (
    <section className="res-sec" id="how-to-read" aria-labelledby="how-to-read-title">
      <div className="sec-head">
        <h2 id="how-to-read-title">How to read this</h2>
      </div>
      <div className="read">
        <div className="read-score">
          <h3>Player overlap, from 0 to 1</h3>
          <p>
            For each upcoming game and film, Qloo&apos;s audience data gives a score between 0 and 1: how much its
            players like the same things as the players of the games you named. The higher the score, the more players
            you share.
          </p>
          <ScoreScale rule={rule} />
          <ul className="read-rule">
            <li className="lvl-clash"><span className="dot" aria-hidden="true" /> <span><strong>Red, shared players:</strong> a game at {rule.gameClash.toFixed(2)} or more.</span></li>
            <li className="lvl-overlap"><span className="dot" aria-hidden="true" /> <span><strong>Yellow, some overlap:</strong> a game from {rule.gameOverlap.toFixed(2)}, or a film from {rule.movieOverlap.toFixed(2)}. Films never turn a week red.</span></li>
            <li className="lvl-clear"><span className="dot" aria-hidden="true" /> <span><strong>Green, different players:</strong> below that.</span></li>
            <li className="lvl-open"><span className="dot" aria-hidden="true" /> <span><strong>Grey:</strong> no big release we track that week.</span></li>
          </ul>
          <p className="small muted">
            Best weeks are green or grey, with no Steam storewide sale or Next Fest, and no game at {rule.gameOverlap.toFixed(2)} or
            more within two weeks either side.
          </p>
        </div>
        <div className="read-limits">
          <h3>Before you move your date</h3>
          <ul>
            <li>
              <strong>Overlap is not sales.</strong> It says how alike two audiences are. It is not a share of players,
              and Quiet Week makes no sales forecast.
            </li>
            <li>
              <strong>Some scores use an earlier game.</strong> Qloo cannot score a game or film before it comes out, so
              Quiet Week measures an earlier one from the same series (GTA V for GTA VI) and names it next to every number.
            </li>
            <li>
              <strong>Your players are described by bigger games.</strong> Qloo has little data on small titles, so the 1
              to 3 games you name stand in for your audience.
            </li>
            <li>
              <strong>Dates move.</strong> Each date was checked by hand on {shortDate(calendarUpdated)},{" "}
              {calendarUpdated.slice(0, 4)} against the linked source. Check again before you commit.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

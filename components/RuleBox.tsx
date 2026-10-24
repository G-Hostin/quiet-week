import type { RuleConfig } from "@/lib/types";

export default function RuleBox({ rule }: { rule: RuleConfig }) {
  const o = rule.gameOverlap * 100;
  const c = rule.gameClash * 100;
  return (
    <div className="rule card">
      <h3>How a week gets its colour</h3>
      <p>
        A week turns <strong className="t-clash">red</strong> when a game released that week has a Qloo affinity of{" "}
        <span className="num">{rule.gameClash.toFixed(2)}</span> or more with your players,{" "}
        <strong className="t-overlap">yellow</strong> from <span className="num">{rule.gameOverlap.toFixed(2)}</span> (or a
        film from <span className="num">{rule.movieOverlap.toFixed(2)}</span>), <strong className="t-clear">green</strong>{" "}
        below that, and grey when no tracked release lands that week.
      </p>
      <div
        className="rule-scale"
        aria-hidden="true"
        style={{ background: `linear-gradient(90deg, var(--clear) 0 ${o}%, var(--overlap) ${o}% ${c}%, var(--clash) ${c}% 100%)` }}
      >
        <span className="rs-0">0</span>
        <span className="rs-o" style={{ left: `${o}%` }}>{rule.gameOverlap.toFixed(2)}</span>
        <span className="rs-c" style={{ left: `${c}%` }}>{rule.gameClash.toFixed(2)}</span>
        <span className="rs-1">1</span>
      </div>
      <p className="small muted">
        Why these numbers: across the three examples, games scored from 0.44 to 0.90 and half of them sat between 0.55
        and 0.67, so 0.68 marks the top quarter and 0.75 the clear outliers (GTA V for western players: 0.90). Blockbuster
        films score 0.63 to 0.81 for every audience we tried, so a film can only turn a week yellow. Recommended weeks have
        no Steam storewide sale or Next Fest and no game at 0.68 or more within two weeks either side.
      </p>
    </div>
  );
}

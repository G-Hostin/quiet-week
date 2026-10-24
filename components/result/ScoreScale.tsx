import { aff } from "@/lib/format";
import type { Level, RuleConfig } from "@/lib/types";

/**
 * The 0-to-1 player overlap scale with the colour thresholds, and an optional marker.
 * Drawn once on the answer card (GTA VI) and once in "How to read" (no marker).
 */
export default function ScoreScale(props: { rule: RuleConfig; value?: number | null; level?: Level; label?: string }) {
  const o = props.rule.gameOverlap * 100;
  const c = props.rule.gameClash * 100;
  const v = props.value ?? null;
  return (
    <div className="scale">
      <div
        className="scale-bar"
        style={{ background: `linear-gradient(90deg, var(--clear) 0 ${o}%, var(--overlap) ${o}% ${c}%, var(--clash) ${c}% 100%)` }}
        role={v !== null ? "img" : undefined}
        aria-label={v !== null ? `${props.label ?? "Score"}: ${aff(v)} on a scale from 0 to 1` : undefined}
        aria-hidden={v === null ? true : undefined}
      >
        {v !== null && (
          <span className={`scale-mark lvl-${props.level ?? "open"}`} style={{ left: `${Math.max(0, Math.min(1, v)) * 100}%` }}>
            <span className="scale-val num">{aff(v)}</span>
          </span>
        )}
      </div>
      <div className="scale-ticks" aria-hidden="true">
        <span style={{ left: 0 }}>0</span>
        <span className="t-o" style={{ left: `${o}%` }}>{props.rule.gameOverlap.toFixed(2)}</span>
        <span className="t-c" style={{ left: `${c}%` }}>{props.rule.gameClash.toFixed(2)}</span>
        <span style={{ right: 0 }}>1</span>
      </div>
      <div className="scale-words" aria-hidden="true">
        <span>Different players</span>
        <span>Shared players</span>
      </div>
    </div>
  );
}

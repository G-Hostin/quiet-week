// The colour rule: one place, documented, tested.
import type { Level, ReleaseKind, RuleConfig } from "./types";

/**
 * Thresholds chosen after looking at the real scores of the three examples
 * (see data/examples/*.json):
 * - games scored for an audience range from about 0.44 to 0.90;
 * - upcoming blockbuster films score 0.63 to 0.81 for every audience we tried,
 *   so a film's score says more about the film's reach than about a shared niche.
 */
export const DEFAULT_RULE: RuleConfig = {
  gameClash: 0.75,
  gameOverlap: 0.68,
  movieOverlap: 0.78,
};

export function levelFor(kind: ReleaseKind, affinity: number | null, rule: RuleConfig = DEFAULT_RULE): Level {
  if (affinity === null || Number.isNaN(affinity)) return "open";
  if (kind === "game") {
    if (affinity >= rule.gameClash) return "clash";
    if (affinity >= rule.gameOverlap) return "overlap";
    return "clear";
  }
  // A film competes for evenings, not for the same purchase: at most "overlap".
  if (affinity >= rule.movieOverlap) return "overlap";
  return "clear";
}

const ORDER: Record<Level, number> = { open: 0, clear: 1, overlap: 2, clash: 3 };

export function maxLevel(levels: Level[]): Level {
  let best: Level = "open";
  for (const l of levels) if (ORDER[l] > ORDER[best]) best = l;
  return best;
}

export function levelRank(l: Level): number {
  return ORDER[l];
}

export function ruleSentence(rule: RuleConfig = DEFAULT_RULE): string {
  return (
    `A week turns red when a game released that week has a Qloo affinity of ${rule.gameClash.toFixed(2)} or more with your players, ` +
    `yellow from ${rule.gameOverlap.toFixed(2)} (or a film from ${rule.movieOverlap.toFixed(2)}; films never turn a week red), ` +
    `green below that, and grey when no tracked release lands that week.`
  );
}

export const LEVEL_LABEL: Record<Level, string> = {
  clash: "Shared players",
  overlap: "Some overlap",
  clear: "Different players",
  open: "No big release",
};

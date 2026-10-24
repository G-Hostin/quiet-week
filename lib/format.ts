// Client-safe display helpers.
import type { Level, ScoredRelease } from "./types";

export function aff(a: number | null | undefined): string {
  return a === null || a === undefined ? "n/a" : a.toFixed(2);
}

export const LEVEL_TEXT: Record<Level, string> = {
  clash: "Shared players",
  overlap: "Some overlap",
  clear: "Different players",
  open: "No big release",
};

export const LEVEL_SHORT: Record<Level, string> = {
  clash: "Red",
  overlap: "Yellow",
  clear: "Green",
  open: "Grey",
};

/** Bar height in the meter (0..1): stepped by colour, nudged by the score inside the band. */
export function barHeight(level: Level, peak: number | null): number {
  const t = peak === null ? 0 : Math.max(0, Math.min(1, (peak - 0.4) / 0.5));
  switch (level) {
    case "clash":
      return 0.86 + 0.14 * t;
    case "overlap":
      return 0.58 + 0.16 * t;
    case "clear":
      return 0.26 + 0.18 * t;
    default:
      return 0.07;
  }
}

export function measuredAs(r: ScoredRelease): string {
  if (r.via === "stand-in" && r.standIn) return `through ${r.standIn.title}`;
  if (r.via === "own") return "its own Qloo score";
  return "no Qloo score";
}

export function kindLabel(k: "game" | "movie"): string {
  return k === "game" ? "Game" : "Film";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

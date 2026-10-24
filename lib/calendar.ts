// Weeks, colours and week picking. Pure functions (tested in tests/calendar.test.ts).
import { addDays, daysBetweenInclusiveOverlap, mondayOnOrAfter } from "./dates";
import { levelRank, maxLevel } from "./rules";
import type { Level, ScoredRelease, SteamEvent, Week } from "./types";

/**
 * Weight of a release in the week logic: its Qloo score, or 1 when it continues a game the user named
 * (Qloo gives no number for those, but they share the user's players by definition).
 */
export function weightOf(r: ScoredRelease): number | null {
  return r.via === "named" ? 1 : r.affinity;
}

/** A Steam storewide event "covers" a week when it runs on at least this many of its 7 days. */
export const STEAM_EVENT_MIN_DAYS = 3;

export function buildWeeks(
  window: { start: string; end: string },
  releases: ScoredRelease[],
  events: SteamEvent[],
): Week[] {
  const weeks: Week[] = [];
  // Only whole weeks inside the window: a week that runs past it could look empty
  // just because we do not track the releases beyond the window.
  for (let start = mondayOnOrAfter(window.start); addDays(start, 6) <= window.end; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    const inWeek = releases.filter((r) => r.date >= start && r.date <= end);
    const level: Level = maxLevel(inWeek.map((r) => r.level));
    let peak: number | null = null;
    let peakKey: string | null = null;
    for (const r of inWeek) {
      const w = weightOf(r);
      if (w !== null && (peak === null || w > peak)) {
        peak = w;
        peakKey = r.key;
      }
    }
    const steam = events
      .filter((e) => daysBetweenInclusiveOverlap(start, end, e.start, e.end) >= STEAM_EVENT_MIN_DAYS)
      .map((e) => e.key);
    weeks.push({ start, end, level, releaseKeys: inWeek.map((r) => r.key), steamEvents: steam, peak, peakKey });
  }
  return weeks;
}

/** Highest game affinity released in the week (films excluded). */
export function gamePeak(week: Week, byKey: Map<string, ScoredRelease>): number {
  let p = 0;
  for (const k of week.releaseKeys) {
    const r = byKey.get(k);
    const w = r ? weightOf(r) : null;
    if (r && r.kind === "game" && w !== null) p = Math.max(p, w);
  }
  return p;
}

/** Your launch fortnight: a game released up to two weeks either side still competes for the same players. */
export const NEIGHBOUR_OFFSETS = [-2, -1, 1, 2];

/**
 * Pressure on a launch week: the strongest of (a) any release that week and
 * (b) a game released up to two weeks earlier (its players are still busy with it)
 * or up to two weeks later (its launch marketing peaks during your launch).
 */
export function pressure(i: number, weeks: Week[], byKey: Map<string, ScoredRelease>): number {
  let p = weeks[i].peak ?? 0;
  for (const d of NEIGHBOUR_OFFSETS) {
    const j = i + d;
    if (j >= 0 && j < weeks.length) p = Math.max(p, gamePeak(weeks[j], byKey));
  }
  return p;
}

export interface WeekChoice {
  index: number;
  week: Week;
  pressure: number;
  previousKey: string | null;
}

/** Recommended weeks: no Steam storewide event, green or grey, lowest pressure, spread apart. */
export function pickRecommended(weeks: Week[], releases: ScoredRelease[], n = 3): WeekChoice[] {
  const byKey = new Map(releases.map((r) => [r.key, r]));
  const candidates = weeks
    .map((week, index) => ({ index, week, pressure: pressure(index, weeks, byKey), previousKey: neighbourGameKey(index, weeks, byKey) }))
    .filter((c) => c.week.steamEvents.length === 0 && (c.week.level === "clear" || c.week.level === "open"))
    .sort((a, b) => a.pressure - b.pressure || levelRank(a.week.level) - levelRank(b.week.level) || a.index - b.index);
  const chosen: WeekChoice[] = [];
  for (const c of candidates) {
    if (chosen.length >= n) break;
    if (chosen.some((x) => Math.abs(x.index - c.index) < 2)) continue;
    chosen.push(c);
  }
  // Not enough spread-out weeks: fill with the next best ones.
  for (const c of candidates) {
    if (chosen.length >= n) break;
    if (!chosen.includes(c)) chosen.push(c);
  }
  return chosen.sort((a, b) => a.index - b.index);
}

/**
 * Weeks to avoid: red or yellow weeks first (strongest game score that week),
 * then the week right after a strong game, whose players are still busy with it.
 */
export function pickAvoid(weeks: Week[], releases: ScoredRelease[], n = 2): WeekChoice[] {
  const byKey = new Map(releases.map((r) => [r.key, r]));
  return weeks
    .map((week, index) => {
      const own = gamePeak(week, byKey) || (week.peak ?? 0);
      const prev = index > 0 ? gamePeak(weeks[index - 1], byKey) : 0;
      const prevKey = prev > own ? topGameKey(weeks[index - 1], byKey) : null;
      return { index, week, pressure: Math.max(own, prev), previousKey: prevKey };
    })
    .sort((a, b) => levelRank(b.week.level) - levelRank(a.week.level) || b.pressure - a.pressure || a.index - b.index)
    .slice(0, n)
    .sort((a, b) => a.index - b.index);
}

function heavier(r: ScoredRelease | undefined, best: ScoredRelease | null): boolean {
  const w = r ? weightOf(r) : null;
  return !!r && r.kind === "game" && w !== null && (!best || w > (weightOf(best) ?? 0));
}

function topGameKey(week: Week, byKey: Map<string, ScoredRelease>): string | null {
  let best: ScoredRelease | null = null;
  for (const k of week.releaseKeys) {
    const r = byKey.get(k);
    if (heavier(r, best)) best = r!;
  }
  return best ? best.key : null;
}

/** Highest-scored game released in the neighbouring weeks (see NEIGHBOUR_OFFSETS). */
function neighbourGameKey(i: number, weeks: Week[], byKey: Map<string, ScoredRelease>): string | null {
  let best: ScoredRelease | null = null;
  for (const j of NEIGHBOUR_OFFSETS.map((d) => i + d)) {
    if (j < 0 || j >= weeks.length) continue;
    for (const k of weeks[j].releaseKeys) {
      const r = byKey.get(k);
      if (heavier(r, best)) best = r!;
    }
  }
  return best ? best.key : null;
}

/** Rank scored games from closest (1) to farthest from the user's players. */
export function rankGames(releases: ScoredRelease[]): ScoredRelease[] {
  const scored = releases.filter((r) => r.kind === "game" && r.affinity !== null);
  scored.sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
  scored.forEach((r, i) => (r.rank = i + 1));
  return releases;
}

// Stand-in logic: score the release itself when Qloo can, otherwise its declared stand-in.
import type { Release } from "./types";

export interface Target {
  releaseKey: string;
  id: string;
  role: "own" | "stand-in";
}

/** Every entity we ask Qloo to score for a release: its own id first, then its stand-in. */
export function targetsFor(releases: Release[]): Target[] {
  const out: Target[] = [];
  for (const r of releases) {
    if (r.qlooId) out.push({ releaseKey: r.key, id: r.qlooId, role: "own" });
    if (r.standIn) out.push({ releaseKey: r.key, id: r.standIn.qlooId, role: "stand-in" });
  }
  return out;
}

export function uniqueIds(targets: Target[]): string[] {
  return [...new Set(targets.map((t) => t.id))];
}

export interface Resolved {
  affinity: number | null;
  via: "own" | "stand-in" | "none";
  scoredId: string | null;
}

/**
 * Pick the number shown for a release. The release's own score always wins;
 * the stand-in is used only when Qloo returns no score for the release itself.
 */
export function resolveScore(r: Release, scores: Map<string, number>): Resolved {
  if (r.qlooId && scores.has(r.qlooId)) return { affinity: scores.get(r.qlooId)!, via: "own", scoredId: r.qlooId };
  if (r.standIn && scores.has(r.standIn.qlooId)) {
    return { affinity: scores.get(r.standIn.qlooId)!, via: "stand-in", scoredId: r.standIn.qlooId };
  }
  return { affinity: null, via: "none", scoredId: null };
}

/**
 * The game the user named that this release continues, if any: its own Qloo entity or its stand-in
 * is one of the audience games. Qloo never scores a signal entity against itself, so without this
 * check a sequel of a game the user named would silently drop out of the calendar.
 */
export function namedMatch(r: Release, audience: { id: string; name: string }[]): string | null {
  if (r.kind !== "game") return null;
  const hit = audience.find((a) => (r.qlooId && a.id === r.qlooId) || (r.standIn && a.id === r.standIn.qlooId));
  return hit ? hit.name : null;
}

/** The stand-in table, as the agent sees it (titles only, no secrets). */
export function standInTable(releases: Release[]) {
  return releases
    .filter((r) => r.standIn)
    .map((r) => ({ release: r.title, standIn: r.standIn!.title, reason: r.standIn!.reason }));
}

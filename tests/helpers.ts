// Small builders for test fixtures.
import type { Level, Release, ScoredRelease } from "../lib/types";

let n = 0;

export function rel(p: Partial<Release> & { date: string }): Release {
  n++;
  return {
    key: p.key ?? `r${n}`,
    title: p.title ?? `Release ${n}`,
    kind: p.kind ?? "game",
    date: p.date,
    source: p.source ?? { url: "https://example.com/source", publisher: "Example", says: "date" },
    verifiedOn: p.verifiedOn ?? "2026-10-23",
    qlooId: p.qlooId === undefined ? null : p.qlooId,
    standIn: p.standIn ?? null,
  };
}

export function scored(p: Partial<ScoredRelease> & { date: string; affinity: number | null; level: Level }): ScoredRelease {
  const base = rel(p);
  return { ...base, affinity: p.affinity, level: p.level, via: p.via ?? (p.affinity === null ? "none" : "own"), rank: p.rank };
}

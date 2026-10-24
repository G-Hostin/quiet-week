// Shared types for releases, scores, weeks and the agent journal.
import type { QlooCallRecord } from "./qloo-record";

export type ReleaseKind = "game" | "movie";
export type Level = "clash" | "overlap" | "clear" | "open";

export interface Source {
  url: string;
  publisher: string;
  /** What the source says, in a few words. */
  says: string;
}

export interface StandIn {
  title: string;
  qlooId: string;
  reason: string;
}

export interface Release {
  key: string;
  title: string;
  kind: ReleaseKind;
  /** ISO date (YYYY-MM-DD), North America. */
  date: string;
  platforms?: string;
  source: Source;
  verifiedOn: string;
  /** Qloo entity of the release itself, if Qloo has one. */
  qlooId: string | null;
  standIn: StandIn | null;
  note?: string;
}

export interface SteamEvent {
  key: string;
  title: string;
  start: string;
  end: string;
  source: Source;
  verifiedOn: string;
}

export interface ReleaseData {
  updated: string;
  releases: Release[];
  steamEvents: SteamEvent[];
}

export interface ScoredRelease extends Release {
  affinity: number | null;
  /** "own" = Qloo scored the release itself; "stand-in" = scored through its stand-in. */
  via: "own" | "stand-in" | "none";
  level: Level;
  /** Rank among scored games (1 = closest to your players). */
  rank?: number;
  /** Index into evidence.calls of the call that produced the number. */
  callIndex?: number;
}

export interface Week {
  start: string;
  end: string;
  level: Level;
  releaseKeys: string[];
  steamEvents: string[];
  /** Highest affinity among the week's releases (games and films), or null. */
  peak: number | null;
  peakKey: string | null;
}

export interface Pick {
  weekStart: string;
  level: Level;
  sentence: string;
  releaseKey?: string;
}

export interface GtaBox {
  answer: "yes" | "maybe" | "no" | "unknown";
  affinity: number | null;
  standInTitle: string | null;
  rank: number | null;
  of: number;
  sentence: string;
}

export type StepKind = "search" | "check" | "swap" | "measure" | "compute" | "write" | "warn" | "think" | "done";

export interface Step {
  ms: number;
  kind: StepKind;
  text: string;
  detail?: string;
}

export interface AudienceGame {
  id: string;
  name: string;
  image?: string;
  year?: string;
}

export interface Analysis {
  id: string;
  label: string;
  pitch: string;
  mode: "example" | "live";
  createdAt: string;
  audience: AudienceGame[];
  window: { start: string; end: string };
  releases: ScoredRelease[];
  weeks: Week[];
  verdict: {
    recommended: Pick[];
    avoid: Pick[];
    gta: GtaBox;
    summary: string;
    summaryBy: "agent" | "template";
  };
  evidence: {
    calls: QlooCallRecord[];
    names: Record<string, string>;
    rule: RuleConfig;
  };
  steps: Step[];
  stats: { qlooCalls: number; qlooCached: number; geminiCalls: number; seconds: number; model: string | null };
}

export interface RuleConfig {
  gameClash: number;
  gameOverlap: number;
  movieOverlap: number;
}

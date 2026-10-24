// State of one analysis run: Qloo scores per release, stand-in swaps, calendar build.
import { buildWeeks, rankGames } from "../calendar";
import { eventsInWindow, releasesInWindow } from "../data";
import { chunk, overlap, MOVIE, VIDEOGAME } from "../qloo-ops";
import type { QlooCallRecord } from "../qloo-record";
import { DEFAULT_RULE, levelFor } from "../rules";
import { namedMatch } from "../standins";
import type { Release, ScoredRelease, SteamEvent, Week } from "../types";
import { buildVerdict, fmt } from "../verdict";
import type { Emit } from "./loop";

export interface Score {
  affinity: number;
  via: "own" | "stand-in";
  call: number;
}

export interface Built {
  scored: ScoredRelease[];
  weeks: Week[];
  verdict: ReturnType<typeof buildVerdict>;
}

export class Session {
  readonly releases: Release[];
  readonly events: SteamEvent[];
  readonly byKey: Map<string, Release>;
  readonly calls: QlooCallRecord[] = [];
  readonly names: Record<string, string> = {};
  readonly scores = new Map<string, Score>();
  readonly triedStandIn = new Set<string>();
  built: Built | null = null;
  summary: string | null = null;

  constructor(
    readonly audienceIds: string[],
    readonly window: { start: string; end: string },
    readonly emit: Emit,
    /** The games the user named (ids and titles), to spot sequels Qloo cannot score for them. */
    readonly audience: { id: string; name: string }[] = [],
  ) {
    this.releases = releasesInWindow(window.start, window.end);
    this.events = eventsInWindow(window.start, window.end);
    this.byKey = new Map(this.releases.map((r) => [r.key, r]));
  }

  /** Score releases (own entity or stand-in), one Qloo call per type and per 25 targets. */
  async score(list: Release[], useStandIn: boolean): Promise<void> {
    for (const kind of ["game", "movie"] as const) {
      const group = list.filter((r) => r.kind === kind && (useStandIn ? r.standIn : r.qlooId));
      for (const part of chunk(group, 25)) {
        const idOf = (r: Release) => (useStandIn ? r.standIn!.qlooId : r.qlooId!);
        const ids = [...new Set(part.map(idOf))];
        const { scores, record } = await overlap(this.audienceIds, ids, kind === "game" ? VIDEOGAME : MOVIE);
        this.calls.push(record);
        const got = new Map(scores.map((x) => [x.id, x]));
        for (const x of scores) this.names[x.id] = x.name;
        for (const r of part) {
          if (useStandIn) this.triedStandIn.add(r.key);
          const hit = got.get(idOf(r));
          if (hit && !this.scores.has(r.key)) {
            this.scores.set(r.key, { affinity: hit.affinity, via: useStandIn ? "stand-in" : "own", call: this.calls.length - 1 });
          }
        }
      }
    }
  }

  unscored(): Release[] {
    return this.releases.filter((r) => !this.scores.has(r.key));
  }

  ownScored(): Release[] {
    return this.releases.filter((r) => this.scores.get(r.key)?.via === "own");
  }

  /** Make sure every release got its chance: own score first, then stand-in. */
  async completeMissing(): Promise<void> {
    if (!this.calls.length) await this.score(this.releases.filter((r) => r.qlooId), false);
    const missing = this.unscored().filter((r) => r.standIn && !this.triedStandIn.has(r.key));
    if (!missing.length) return;
    await this.score(missing, true);
    this.reportSwaps(missing);
  }

  reportSwaps(list: Release[]): void {
    for (const r of list) {
      if (namedMatch(r, this.audience)) continue; // reported by build()
      const s = this.scores.get(r.key);
      if (s?.via === "stand-in") this.emit("swap", `${r.title}: no Qloo score yet, using ${r.standIn!.title} as stand-in (${fmt(s.affinity)})`);
      else if (!s) this.emit("warn", `${r.title}: stand-in ${r.standIn!.title} has no score either`);
    }
  }

  build(): Built {
    const scored: ScoredRelease[] = this.releases.map((r) => {
      const s = this.scores.get(r.key);
      const named = namedMatch(r, this.audience);
      if (named && s?.via !== "own") {
        this.emit("swap", `${r.title}: continues ${named}, which you named. Qloo leaves your own games out of its results, so this release counts as red, with no number`);
        return { ...r, affinity: null, via: "named" as const, namedAs: named, level: "clash" as const };
      }
      const affinity = s ? s.affinity : null;
      return { ...r, affinity, via: s ? s.via : "none", level: levelFor(r.kind, affinity, DEFAULT_RULE), callIndex: s?.call };
    });
    rankGames(scored);
    const weeks = buildWeeks(this.window, scored, this.events);
    this.built = { scored, weeks, verdict: buildVerdict(weeks, scored, this.events) };
    return this.built;
  }
}

export function round2(a: number): number {
  return Math.round(a * 100) / 100;
}

export function countLevel(weeks: { level: string }[], l: string): number {
  return weeks.filter((w) => w.level === l).length;
}

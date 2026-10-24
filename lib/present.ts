// Presentation helpers for the result view: the plain-language answer, a short reason per picked week,
// the default selected week and the view chosen from the URL. Pure functions, no new numbers:
// everything shown comes from the analysis (Qloo scores, sourced dates).
import { gamePeak } from "./calendar";
import { aff } from "./format";
import type { Analysis, GtaBox, Pick, ScoredRelease, StepKind } from "./types";

export const GTA_KEY = "gta6";

/** The week selected when a result opens: GTA VI's week if it is in the window, else the first quiet week. */
export function defaultWeek(a: Analysis): string {
  const gta = a.weeks.find((w) => w.releaseKeys.includes(GTA_KEY));
  if (gta) return gta.start;
  const first = a.verdict.recommended[0]?.weekStart;
  return first && a.weeks.some((w) => w.start === first) ? first : a.weeks[0]?.start ?? "";
}

export interface Answer {
  tone: GtaBox["answer"];
  /** One sentence, shown as the page's main heading. */
  text: string;
}

/** The answer in one sentence, from the GTA VI box (same thresholds as the colour rule). */
export function answerFor(a: Analysis): Answer {
  const g = a.verdict.gta;
  const inWindow = a.releases.some((r) => r.key === GTA_KEY);
  if (!inWindow || g.affinity === null) return { tone: "unknown", text: "Here are your quietest weeks." };
  if (g.answer === "yes") return { tone: "yes", text: "Move away from GTA VI's launch." };
  if (g.answer === "maybe") return { tone: "maybe", text: "Avoid GTA VI's launch week if you can." };
  return { tone: "no", text: "No need to dodge GTA VI." };
}

export interface WeekReason {
  text: string;
  release: ScoredRelease | null;
  /** True when the week is flagged because of a strong game the week before. */
  weekAfter: boolean;
}

function topOfWeek(keys: string[], byKey: Map<string, ScoredRelease>, gamesOnly: boolean): ScoredRelease | null {
  let best: ScoredRelease | null = null;
  for (const k of keys) {
    const r = byKey.get(k);
    if (!r || r.affinity === null || (gamesOnly && r.kind !== "game")) continue;
    if (!best || r.affinity > (best.affinity ?? 0)) best = r;
  }
  return best;
}

/** A short reason for a recommended or avoided week, built from the same numbers as the verdict. */
export function weekReason(p: Pick, a: Analysis, kind: "pick" | "avoid"): WeekReason {
  const byKey = new Map(a.releases.map((r) => [r.key, r]));
  const i = a.weeks.findIndex((w) => w.start === p.weekStart);
  const week = a.weeks[i];
  if (!week) return { text: "", release: null, weekAfter: false };
  if (kind === "avoid" && i > 0) {
    // Same test as pickAvoid: the week before holds a stronger game than this week.
    const own = gamePeak(week, byKey) || (week.peak ?? 0);
    const prev = gamePeak(a.weeks[i - 1], byKey);
    if (prev > own) {
      const r = topOfWeek(a.weeks[i - 1].releaseKeys, byKey, true);
      if (r) return { text: `The week after ${r.title} (${aff(r.affinity)})`, release: r, weekAfter: true };
    }
  }
  const top = topOfWeek(week.releaseKeys, byKey, false);
  if (!top) return { text: "No big release that week", release: null, weekAfter: false };
  return {
    text: kind === "pick" ? `Biggest release: ${top.title} (${aff(top.affinity)})` : `${top.title} launches (${aff(top.affinity)})`,
    release: top,
    weekAfter: false,
  };
}

/** The sentence under the answer: the GTA VI number in plain words, then the closest release if it is another one. */
export function answerLede(a: Analysis): string[] {
  const g = a.verdict.gta;
  const out: string[] = [];
  const games = a.releases.filter((r) => r.kind === "game" && r.affinity !== null).sort((x, y) => (y.affinity ?? 0) - (x.affinity ?? 0));
  const top = games[0];
  const inWindow = a.releases.some((r) => r.key === GTA_KEY);
  if (inWindow && g.affinity !== null) {
    const place = g.rank === 1 ? `the highest of the ${g.of} upcoming games Qloo scored` : g.rank ? `${ordinal(g.rank)} of the ${g.of} upcoming games Qloo scored` : "";
    const n = aff(g.affinity);
    if (g.answer === "yes") out.push(`GTA VI shares many of your players: Qloo puts the overlap at ${n} out of 1, ${place}. Stay clear of its launch week and the week after.`);
    else if (g.answer === "maybe") out.push(`Some of your players are GTA VI players: Qloo puts the overlap at ${n} out of 1, ${place}. Avoid its launch week if you can.`);
    else out.push(`GTA VI's players are mostly not yours: Qloo puts the overlap at ${n} out of 1, ${place}. Its launch week is not your main risk.`);
  }
  if (top && top.key !== GTA_KEY) out.push(`The upcoming game closest to your players is ${top.title} (${aff(top.affinity)}).`);
  return out;
}

export type View = { kind: "example"; id: string } | { kind: "mine" } | { kind: "tool" };

/** Which screen of /check to show, from its query string. Unknown example ids fall back to the tool. */
export function viewFrom(params: { get(name: string): string | null }, exampleIds: string[]): View {
  const ex = params.get("example");
  if (ex && exampleIds.includes(ex)) return { kind: "example", id: ex };
  if (params.get("result") === "mine") return { kind: "mine" };
  return { kind: "tool" };
}

/**
 * How far the agent got, for the progress checklist: the furthest phase whose step kinds have appeared.
 * Monotonic, so a late "measure" step never moves the checklist backwards. -1 before any step.
 */
export function phaseReached(steps: { kind: StepKind }[], phases: StepKind[][]): number {
  let best = -1;
  for (const s of steps) {
    const i = phases.findIndex((p) => p.includes(s.kind));
    if (i > best) best = i;
  }
  return best;
}

/**
 * Plain-English error for the tool, with one hint that fits the cause.
 * Raw server or browser messages ("Failed to fetch", "HTTP 500", model names) never reach the visitor.
 */
export function friendlyError(raw: string, stage: "resolve" | "analyze"): string {
  const m = (raw || "").toLowerCase();
  if (/too many requests|\b429\b|budget/.test(m)) return "Quiet Week is busy right now. Wait a minute, then try again.";
  if (/failed to fetch|networkerror|load failed|network|internet/.test(m)) return "The connection dropped. Check your internet, then try again.";
  if (/^(give 1 to 3|confirm 1 to 3|send json)/.test(m)) return raw.trim();
  return stage === "resolve"
    ? "Something went wrong while searching Qloo. Try again in a moment."
    : "Something went wrong while measuring your weeks. Try again in a moment.";
}

/** "1st", "2nd", "18th", "22nd". */
export function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Red Dead Redemption 2 and Red Dead Redemption", "A, B and C". */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

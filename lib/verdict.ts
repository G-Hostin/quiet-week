// Verdict: picks + plain sentences built only from Qloo numbers (no invented figures).
import { pickAvoid, pickRecommended, weightOf, type WeekChoice } from "./calendar";
import { shortDate, weekLabel } from "./dates";
import { DEFAULT_RULE } from "./rules";
import type { GtaBox, Pick, RuleConfig, ScoredRelease, SteamEvent, Week } from "./types";

export const GTA_KEY = "gta6";

export function fmt(a: number | null | undefined): string {
  return a === null || a === undefined ? "n/a" : a.toFixed(2);
}

function nameOf(r: ScoredRelease): string {
  return r.via === "stand-in" && r.standIn ? `${r.title} (through ${r.standIn.title})` : r.title;
}

/** "at 0.82", or, for a sequel of a game the user named, the reason it has no number. */
function scorePhrase(r: ScoredRelease, lead = "at"): string {
  return r.via === "named" ? `(it continues ${r.namedAs}, which you named)` : `${lead} ${fmt(r.affinity)}`;
}

export function recommendedSentence(c: WeekChoice, byKey: Map<string, ScoredRelease>): string {
  const inWeek = c.week.releaseKeys.map((k) => byKey.get(k)!).filter(Boolean);
  const scored = inWeek.filter((r) => r.affinity !== null).sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
  const prev = c.previousKey ? byKey.get(c.previousKey) : undefined;
  let s: string;
  if (scored.length === 0) {
    s = "No tracked game or film lands this week.";
  } else {
    const top = scored[0];
    s = `Biggest neighbour: ${nameOf(top)} at ${fmt(top.affinity)}, a different crowd from yours.`;
  }
  if (prev && (weightOf(prev) ?? 0) >= DEFAULT_RULE.gameOverlap) {
    s += ` Nearby: ${nameOf(prev)} lands ${shortDate(prev.date)} ${scorePhrase(prev)}.`;
  } else {
    s += " No Steam storewide sale or Next Fest that week.";
  }
  return s;
}

export function avoidSentence(c: WeekChoice, byKey: Map<string, ScoredRelease>, events: SteamEvent[]): string {
  const inWeek = c.week.releaseKeys.map((k) => byKey.get(k)!).filter((r) => r && weightOf(r) !== null);
  inWeek.sort((a, b) => (weightOf(b) ?? 0) - (weightOf(a) ?? 0));
  const top = inWeek[0];
  const prev = c.previousKey ? byKey.get(c.previousKey) : undefined;
  let s: string;
  if (prev) {
    s = `${nameOf(prev)} launches the week before ${scorePhrase(prev)}; your players will still be busy with it.`;
  } else if (top?.via === "named") {
    s = `${top.title} launches this week. It continues ${top.namedAs}, which you named, so it shares your players.`;
  } else {
    s = top
      ? `${nameOf(top)} scores ${fmt(top.affinity)} with your players${top.rank && top.kind === "game" ? `, #${top.rank} of the games we track` : ""}.`
      : "No tracked release, but no quieter week was left.";
  }
  const steam = c.week.steamEvents.map((k) => events.find((e) => e.key === k)?.title).filter(Boolean);
  if (steam.length) s += ` ${steam.join(" and ")} also runs that week.`;
  return s;
}

export function gtaBox(releases: ScoredRelease[], rule: RuleConfig = DEFAULT_RULE): GtaBox {
  const g = releases.find((r) => r.key === GTA_KEY);
  const of = releases.filter((r) => r.kind === "game" && r.affinity !== null).length;
  if (g && g.via === "named") {
    return {
      answer: "yes", affinity: null, standInTitle: null, namedAs: g.namedAs ?? null, rank: null, of,
      sentence: `Yes. GTA VI continues ${g.namedAs}, which you named, so its players are yours. Stay clear of November 19 and the week after.`,
    };
  }
  if (!g || g.affinity === null) {
    return { answer: "unknown", affinity: null, standInTitle: null, rank: null, of, sentence: "Qloo returned no score for GTA VI or its stand-in." };
  }
  const via = g.via === "stand-in" && g.standIn ? g.standIn.title : null;
  const ranked = g.rank ? ` It ranks #${g.rank} of ${of} games we track for your players.` : "";
  const proxy = via ? ` (measured through ${via}, since Qloo does not score GTA VI before launch)` : "";
  if (g.affinity >= rule.gameClash) {
    return { answer: "yes", affinity: g.affinity, standInTitle: via, rank: g.rank ?? null, of, sentence: `Yes. Your players and GTA's overlap strongly: ${fmt(g.affinity)}${proxy}.${ranked} Stay clear of November 19 and the week after.` };
  }
  if (g.affinity >= rule.gameOverlap) {
    return { answer: "maybe", affinity: g.affinity, standInTitle: via, rank: g.rank ?? null, of, sentence: `Maybe. Some of your players are GTA players: ${fmt(g.affinity)}${proxy}.${ranked} Avoid launch week if you can.` };
  }
  return { answer: "no", affinity: g.affinity, standInTitle: via, rank: g.rank ?? null, of, sentence: `No need to run. GTA's audience is mostly not yours: ${fmt(g.affinity)}${proxy}.${ranked} Its launch week is not your main risk.` };
}

export function buildVerdict(weeks: Week[], releases: ScoredRelease[], events: SteamEvent[]) {
  const byKey = new Map(releases.map((r) => [r.key, r]));
  const rec = pickRecommended(weeks, releases, 3);
  const avo = pickAvoid(weeks, releases, 2);
  const recommended: Pick[] = rec.map((c) => ({ weekStart: c.week.start, level: c.week.level, sentence: recommendedSentence(c, byKey), releaseKey: c.week.peakKey ?? undefined }));
  const avoid: Pick[] = avo.map((c) => ({ weekStart: c.week.start, level: c.week.level, sentence: avoidSentence(c, byKey, events), releaseKey: c.week.peakKey ?? undefined }));
  const gta = gtaBox(releases);
  return { recommended, avoid, gta, summary: templateSummary(recommended, avoid, gta, releases), summaryBy: "template" as const };
}

export function templateSummary(rec: Pick[], avoid: Pick[], gta: GtaBox, releases: ScoredRelease[]): string {
  const games = releases.filter((r) => r.kind === "game" && r.affinity !== null).sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0));
  const top = games[0];
  const best = rec.map((p) => weekLabel(p.weekStart).replace("Week of ", "")).join(", ");
  const worst = avoid.map((p) => shortDate(p.weekStart)).join(" and ");
  const parts = [
    top ? `The release closest to your players is ${nameOf(top)} (${fmt(top.affinity)}).` : "",
    gta.namedAs ? `GTA VI continues ${gta.namedAs}, which you named.` : gta.affinity !== null ? `GTA VI: ${fmt(gta.affinity)}${gta.standInTitle ? ` via ${gta.standInTitle}` : ""}.` : "",
    best ? `Quietest weeks for you: ${best}.` : "",
    worst ? `Avoid the weeks of ${worst}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}

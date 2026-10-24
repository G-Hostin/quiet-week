// Tools the analysis agent can call. Each tool returns titles, dates and Qloo numbers only.
import { addDays, shortDate } from "../dates";
import { DEFAULT_RULE } from "../rules";
import type { Release } from "../types";
import { fmt } from "../verdict";
import { checkSummary } from "./guard";
import type { Tool } from "./loop";
import { countLevel, round2, type Session } from "./session";

const EMPTY = { type: "object", properties: {} };
const KEYS = { type: "object", properties: { keys: { type: "array", items: { type: "string" } } }, required: ["keys"] };

export function analyzeTools(s: Session): Tool[] {
  const keysOf = (args: Record<string, unknown>) => (Array.isArray(args.keys) ? args.keys : []).map(String);
  return [
    {
      decl: { name: "get_release_calendar", description: "List the big game and film releases (sourced dates) and Steam storewide events in the launch window.", parameters: EMPTY },
      run: async () => {
        s.emit("search", `Reading the release calendar: ${s.releases.length} sourced releases, ${s.events.length} Steam events`);
        return {
          releases: s.releases.map((r) => ({ key: r.key, title: r.title, kind: r.kind, date: r.date, has_qloo_entity: !!r.qlooId })),
          steam_events: s.events.map((e) => ({ title: e.title, start: e.start, end: e.end })),
        };
      },
    },
    {
      decl: { name: "measure_overlap", description: "Ask Qloo how much the audience overlaps with each release's own Qloo entity. Unreleased titles usually come back without a score.", parameters: EMPTY },
      run: async () => {
        if (!s.calls.length) await s.score(s.releases.filter((r) => r.qlooId), false);
        const own = s.ownScored();
        s.emit("measure", `Qloo scored ${own.length} of ${s.releases.length} releases directly`, own.map((r) => `${r.title} ${fmt(s.scores.get(r.key)!.affinity)}`).join(" · "));
        return {
          scored: own.map((r) => ({ key: r.key, title: r.title, affinity: round2(s.scores.get(r.key)!.affinity) })),
          unscored: s.unscored().map((r) => ({ key: r.key, title: r.title, reason: r.qlooId ? "no score yet" : "not in Qloo" })),
        };
      },
    },
    {
      decl: { name: "get_stand_ins", description: "Get the stand-in game or film (usually an earlier entry in the series) for releases Qloo cannot score.", parameters: KEYS },
      run: async (args) => {
        const list = keysOf(args).map((k) => s.byKey.get(k)).filter((r): r is Release => !!r?.standIn);
        s.emit("think", `Looking up stand-ins for ${list.length} unscored releases`);
        return { stand_ins: list.map((r) => ({ key: r.key, release: r.title, stand_in: r.standIn!.title, reason: r.standIn!.reason })) };
      },
    },
    {
      decl: { name: "measure_stand_ins", description: "Score the stand-ins of the given releases against the audience.", parameters: KEYS },
      run: async (args) => {
        const list = keysOf(args).map((k) => s.byKey.get(k)).filter((r): r is Release => !!r?.standIn && !s.scores.has(r.key) && !s.triedStandIn.has(r.key));
        await s.score(list, true);
        s.reportSwaps(list);
        return {
          scored: list.filter((r) => s.scores.has(r.key)).map((r) => ({ key: r.key, title: r.title, stand_in: r.standIn!.title, affinity: round2(s.scores.get(r.key)!.affinity) })),
          still_unscored: list.filter((r) => !s.scores.has(r.key)).map((r) => r.title),
        };
      },
    },
    {
      decl: { name: "build_calendar", description: "Colour every week, pick 3 weeks to recommend and 2 to avoid, and answer whether to dodge GTA VI.", parameters: EMPTY },
      run: async () => {
        await s.completeMissing();
        const b = s.build();
        s.emit("compute", `Coloured ${b.weeks.length} weeks: ${countLevel(b.weeks, "clash")} red, ${countLevel(b.weeks, "overlap")} yellow, ${countLevel(b.weeks, "clear")} green`);
        const closest = b.scored.filter((r) => r.affinity !== null).sort((x, y) => y.affinity! - x.affinity!).slice(0, 5);
        return {
          best_weeks: b.verdict.recommended.map((p) => ({ week: `week of ${shortDate(p.weekStart)}`, why: p.sentence })),
          weeks_to_avoid: b.verdict.avoid.map((p) => ({ week: `week of ${shortDate(p.weekStart)}`, why: p.sentence })),
          gta: b.verdict.gta,
          closest: closest.map((r) => ({ title: r.title, date: r.date, affinity: round2(r.affinity!), via: r.via === "stand-in" ? r.standIn!.title : "own score" })),
          rule: DEFAULT_RULE,
        };
      },
    },
    {
      decl: {
        name: "submit_verdict",
        description: "Submit a 2-3 sentence verdict for the studio. Use only numbers returned by the tools.",
        parameters: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
      },
      run: async (args) => {
        if (!s.built) return { error: "Call build_calendar first." };
        const text = String(args.summary || "").trim();
        const allowed = s.built.scored.filter((r) => r.affinity !== null).map((r) => r.affinity!);
        const v = s.built.verdict;
        const days = [
          ...[...v.recommended, ...v.avoid].flatMap((p) => [p.weekStart, addDays(p.weekStart, 6)]),
          ...s.releases.map((r) => r.date),
          ...s.events.flatMap((e) => [e.start, e.end]),
        ];
        const g = checkSummary(text, allowed, [s.built.weeks.length, v.gta.of, v.gta.rank ?? 0], days);
        if (!g.ok) {
          s.emit("warn", `Verdict rejected by the number check: ${g.reason}. Rewriting`);
          return { error: `Rejected: ${g.reason}. Use only the affinities returned by the tools, no sales or forecast words.` };
        }
        s.summary = text;
        s.emit("write", "Verdict written from Qloo numbers only");
        return { ok: true };
      },
    },
  ];
}

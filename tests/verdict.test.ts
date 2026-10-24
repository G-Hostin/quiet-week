import { describe, expect, it } from "vitest";
import { checkSummary, datesIn } from "../lib/agent/guard";
import { buildWeeks } from "../lib/calendar";
import { buildVerdict, gtaBox } from "../lib/verdict";
import { scored } from "./helpers";
import cozy from "../data/examples/cozy-farm.json";
import western from "../data/examples/action-western.json";
import metroid from "../data/examples/metroidvania.json";
import type { Analysis } from "../lib/types";

const WINDOW = { start: "2026-11-01", end: "2027-03-31" };
const standIn = { title: "Grand Theft Auto V", qlooId: "FEFD4E0D-D8F2-4BF9-86C9-06949DE82BCD", reason: "previous game" };

describe("GTA VI box", () => {
  it("says yes, maybe or no from the colour thresholds", () => {
    const mk = (a: number) => [scored({ key: "gta6", date: "2026-11-19", affinity: a, level: "clash", via: "stand-in", standIn, rank: 1 })];
    expect(gtaBox(mk(0.9)).answer).toBe("yes");
    expect(gtaBox(mk(0.7)).answer).toBe("maybe");
    expect(gtaBox(mk(0.55)).answer).toBe("no");
  });

  it("names the stand-in next to the number", () => {
    const g = gtaBox([scored({ key: "gta6", date: "2026-11-19", affinity: 0.9, level: "clash", via: "stand-in", standIn, rank: 1 })]);
    expect(g.standInTitle).toBe("Grand Theft Auto V");
    expect(g.sentence).toContain("0.90");
    expect(g.sentence).toContain("Grand Theft Auto V");
  });

  it("reports unknown instead of guessing when Qloo has no score", () => {
    expect(gtaBox([scored({ key: "gta6", date: "2026-11-19", affinity: null, level: "open" })]).answer).toBe("unknown");
  });
});

describe("verdict", () => {
  it("returns 3 recommended weeks and 2 to avoid, each with a sentence", () => {
    const rs = [scored({ key: "gta6", date: "2026-11-19", affinity: 0.9, level: "clash" }), scored({ date: "2027-02-04", affinity: 0.5, level: "clear" })];
    const weeks = buildWeeks(WINDOW, rs, []);
    const v = buildVerdict(weeks, rs, []);
    expect(v.recommended).toHaveLength(3);
    expect(v.avoid).toHaveLength(2);
    for (const p of [...v.recommended, ...v.avoid]) expect(p.sentence.length).toBeGreaterThan(20);
    expect(v.summary).toContain("0.90");
  });
});

describe("agent text check", () => {
  const allowed = [0.9, 0.553, 0.81];

  it("accepts a summary that only quotes Qloo numbers and real dates", () => {
    const t = "Yes, dodge GTA VI: 0.90 through Grand Theft Auto V. Launch in the week of Jan 4 instead.";
    expect(checkSummary(t, allowed, [], ["2027-01-04"]).ok).toBe(true);
  });

  it("rejects a number Qloo did not return", () => {
    expect(checkSummary("Your players overlap with GTA VI at 0.93, so move your launch date.", allowed).ok).toBe(false);
  });

  it("rejects sales talk, percentages and forecasts", () => {
    expect(checkSummary("GTA VI at 0.90 will hurt your sales in its launch week, move away.", allowed).ok).toBe(false);
    expect(checkSummary("About 90% of your players also play GTA, so you should move away.", allowed).ok).toBe(false);
    expect(checkSummary("We predict a quiet week of Jan 4 for your launch at 0.90 overlap.", allowed).ok).toBe(false);
  });

  it("rejects a week the tools did not return", () => {
    expect(checkSummary("Best weeks to launch are the week of Jan 11 and Feb 8, well clear of GTA.", allowed, [], ["2027-01-04"]).ok).toBe(false);
    expect(datesIn("week of Jan 4 and Nov. 19")).toEqual(["01-04", "11-19"]);
  });
});

describe("precomputed examples", () => {
  const all = [cozy, western, metroid] as unknown as Analysis[];

  it("all three render a full verdict", () => {
    for (const a of all) {
      expect(a.weeks.length).toBe(21);
      expect(a.verdict.recommended).toHaveLength(3);
      expect(a.verdict.avoid).toHaveLength(2);
      expect(a.verdict.gta.affinity).not.toBeNull();
      expect(a.evidence.calls.length).toBeGreaterThan(0);
    }
  });

  it("shows the expected contrast on GTA VI's week", () => {
    const gtaWeek = (a: Analysis) => a.weeks.find((w) => w.releaseKeys.includes("gta6"))!;
    expect(gtaWeek(western as unknown as Analysis).level).toBe("clash");
    expect(["clear", "overlap"]).toContain(gtaWeek(cozy as unknown as Analysis).level);
    expect((western as unknown as Analysis).verdict.gta.answer).toBe("yes");
    expect((cozy as unknown as Analysis).verdict.gta.answer).toBe("no");
  });

  it("links every shown score to a recorded Qloo call", () => {
    for (const a of all) {
      for (const r of a.releases) {
        if (r.affinity === null) continue;
        expect(r.callIndex).toBeTypeOf("number");
        expect(a.evidence.calls[r.callIndex!]).toBeDefined();
      }
    }
  });

  it("only uses agent summaries that pass the number check", () => {
    for (const a of all) {
      const allowedA = a.releases.filter((r) => r.affinity !== null).map((r) => r.affinity!);
      const decimals = a.verdict.summary.match(/\d*\.\d+/g) || [];
      for (const d of decimals) expect(allowedA.map((x) => x.toFixed(2))).toContain(Number(d).toFixed(2));
      expect(/sales|revenue|%|forecast/i.test(a.verdict.summary)).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";
import { buildWeeks, pickAvoid, pickRecommended, weightOf } from "../lib/calendar";
import { answerFor, answerLede, weekReason } from "../lib/present";
import { namedMatch } from "../lib/standins";
import type { Analysis } from "../lib/types";
import { buildVerdict, gtaBox } from "../lib/verdict";
import { rel, scored } from "./helpers";

const WINDOW = { start: "2026-11-01", end: "2027-03-31" };
const GTA5 = "FEFD4E0D-D8F2-4BF9-86C9-06949DE82BCD";
const METRO = "METRO-EXODUS-ID";

describe("sequels of a game the user named", () => {
  it("are spotted through the release's own id or its stand-in", () => {
    const metro = rel({ date: "2027-02-04", title: "Metro 2039", standIn: { title: "Metro Exodus", qlooId: METRO, reason: "previous game" } });
    expect(namedMatch(metro, [{ id: METRO, name: "Metro Exodus" }])).toBe("Metro Exodus");
    expect(namedMatch(metro, [{ id: "OTHER", name: "Other" }])).toBeNull();
    const film = rel({ date: "2027-02-04", kind: "movie", standIn: { title: "Metro Exodus", qlooId: METRO, reason: "x" } });
    expect(namedMatch(film, [{ id: METRO, name: "Metro Exodus" }])).toBeNull();
  });

  it("weigh as the strongest possible clash in the week logic", () => {
    const sequel = scored({ date: "2027-02-04", affinity: null, level: "clash", via: "named" });
    expect(weightOf(sequel)).toBe(1);
    const other = scored({ date: "2026-12-10", affinity: 0.6, level: "clear" });
    const weeks = buildWeeks(WINDOW, [sequel, other], []);
    const w = weeks.find((x) => x.releaseKeys.includes(sequel.key))!;
    expect(w.level).toBe("clash");
    expect(w.peakKey).toBe(sequel.key);
    const avoid = pickAvoid(weeks, [sequel, other], 2).map((c) => c.week.start);
    expect(avoid).toContain(w.start);
    const rec = pickRecommended(weeks, [sequel, other], 3).map((c) => c.week.start);
    expect(rec).not.toContain(w.start);
  });

  it("turn the GTA VI answer into a clear yes without inventing a number", () => {
    const gta = { ...scored({ key: "gta6", title: "Grand Theft Auto VI", date: "2026-11-19", affinity: null, level: "clash", via: "named" }), namedAs: "Grand Theft Auto V" };
    const g = gtaBox([gta]);
    expect(g.answer).toBe("yes");
    expect(g.affinity).toBeNull();
    expect(g.namedAs).toBe("Grand Theft Auto V");
    expect(g.sentence).toContain("Grand Theft Auto V");
    expect(g.sentence).not.toMatch(/\d\.\d\d/);
  });

  it("read in plain words on the result page", () => {
    const gta = { ...scored({ key: "gta6", title: "Grand Theft Auto VI", date: "2026-11-19", affinity: null, level: "clash", via: "named" }), namedAs: "Grand Theft Auto V" };
    const metro = { ...scored({ title: "Metro 2039", date: "2027-02-04", affinity: null, level: "clash", via: "named" }), namedAs: "Metro Exodus" };
    const other = scored({ title: "Fable", date: "2027-02-23", affinity: 0.66, level: "clear", rank: 1 });
    const releases = [gta, metro, other];
    const weeks = buildWeeks(WINDOW, releases, []);
    const verdict = buildVerdict(weeks, releases, []);
    const a = { releases, weeks, verdict: { ...verdict, summaryBy: "template" } } as unknown as Analysis;
    expect(answerFor(a)).toEqual({ tone: "yes", text: "Move away from GTA VI's launch." });
    const lede = answerLede(a).join(" ");
    expect(lede).toContain("GTA VI continues Grand Theft Auto V");
    expect(lede).toContain("Metro 2039 continues a game you named");
    expect(lede).not.toContain("n/a");
    const metroWeek = verdict.avoid.find((p) => p.weekStart === "2027-02-01");
    expect(metroWeek).toBeDefined();
    expect(weekReason(metroWeek!, a, "avoid").text).toBe("Metro 2039 launches (continues Metro Exodus)");
    for (const p of [...verdict.avoid, ...verdict.recommended]) expect(p.sentence).not.toContain("n/a");
  });
});

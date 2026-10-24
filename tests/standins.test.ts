import { describe, expect, it } from "vitest";
import releases from "../data/releases.json";
import { resolveScore, standInTable, targetsFor, uniqueIds } from "../lib/standins";
import type { Release } from "../lib/types";
import { rel } from "./helpers";

const GTA6 = "3B397EFF-7FFB-4763-A13D-E343196DF03E";
const GTA5 = "FEFD4E0D-D8F2-4BF9-86C9-06949DE82BCD";

describe("stand-ins", () => {
  const gta = rel({ key: "gta6", title: "Grand Theft Auto VI", date: "2026-11-19", qlooId: GTA6, standIn: { title: "Grand Theft Auto V", qlooId: GTA5, reason: "previous game" } });

  it("asks Qloo for both the release and its stand-in", () => {
    const t = targetsFor([gta]);
    expect(t.map((x) => x.role)).toEqual(["own", "stand-in"]);
    expect(uniqueIds(t)).toEqual([GTA6, GTA5]);
  });

  it("uses the release's own score when Qloo has one", () => {
    const r = resolveScore(gta, new Map([[GTA6, 0.81], [GTA5, 0.9]]));
    expect(r).toEqual({ affinity: 0.81, via: "own", scoredId: GTA6 });
  });

  it("falls back to the stand-in when the release has no score (GTA VI before launch)", () => {
    const r = resolveScore(gta, new Map([[GTA5, 0.9]]));
    expect(r).toEqual({ affinity: 0.9, via: "stand-in", scoredId: GTA5 });
  });

  it("returns no score rather than inventing one", () => {
    expect(resolveScore(gta, new Map())).toEqual({ affinity: null, via: "none", scoredId: null });
    const bare = rel({ date: "2027-01-01" });
    expect(resolveScore(bare, new Map([[GTA5, 0.5]])).via).toBe("none");
  });

  it("lists the stand-in table by title for the agent", () => {
    expect(standInTable([gta])).toEqual([{ release: "Grand Theft Auto VI", standIn: "Grand Theft Auto V", reason: "previous game" }]);
  });
});

describe("hand-kept release calendar", () => {
  const list = (releases as { releases: Release[] }).releases;

  it("has 30 to 40 releases in Nov 2026 to Mar 2027", () => {
    expect(list.length).toBeGreaterThanOrEqual(30);
    expect(list.length).toBeLessThanOrEqual(40);
    for (const r of list) expect(r.date >= "2026-11-01" && r.date <= "2027-03-31").toBe(true);
  });

  it("gives every release a source link, a check date and a way to score it", () => {
    for (const r of list) {
      expect(r.source.url.startsWith("https://")).toBe(true);
      expect(r.source.publisher.length).toBeGreaterThan(0);
      expect(r.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Boolean(r.qlooId || r.standIn)).toBe(true);
    }
  });

  it("uses GTA V as GTA VI's stand-in", () => {
    const g = list.find((r) => r.key === "gta6")!;
    expect(g.date).toBe("2026-11-19");
    expect(g.standIn?.qlooId).toBe(GTA5);
  });

  it("has unique keys", () => {
    expect(new Set(list.map((r) => r.key)).size).toBe(list.length);
  });
});

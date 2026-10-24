import { describe, expect, it } from "vitest";
import { buildWeeks, pickAvoid, pickRecommended, pressure, rankGames } from "../lib/calendar";
import { addDays, mondayOf, mondayOnOrAfter } from "../lib/dates";
import type { SteamEvent } from "../lib/types";
import { scored } from "./helpers";

const WINDOW = { start: "2026-11-01", end: "2027-03-31" };
const steam: SteamEvent[] = [
  { key: "winter", title: "Steam Winter Sale", start: "2026-12-17", end: "2027-01-04", source: { url: "https://partner.steamgames.com", publisher: "Valve", says: "" }, verifiedOn: "2026-10-23" },
];

describe("dates", () => {
  it("finds Mondays in UTC", () => {
    expect(mondayOf("2026-11-19")).toBe("2026-11-16"); // GTA VI is a Thursday
    expect(mondayOnOrAfter("2026-11-01")).toBe("2026-11-02");
    expect(mondayOnOrAfter("2026-11-02")).toBe("2026-11-02");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
  });
});

describe("weeks", () => {
  it("covers only whole Monday-to-Sunday weeks inside the window", () => {
    const weeks = buildWeeks(WINDOW, [], []);
    expect(weeks[0].start).toBe("2026-11-02");
    expect(weeks.at(-1)!.end <= WINDOW.end).toBe(true);
    expect(weeks.length).toBe(21);
    for (const w of weeks) expect(addDays(w.start, 6)).toBe(w.end);
  });

  it("puts a release in its week and colours the week by its worst release", () => {
    const gta = scored({ key: "gta6", date: "2026-11-19", affinity: 0.9, level: "clash" });
    const film = scored({ kind: "movie", date: "2026-11-20", affinity: 0.68, level: "clear" });
    const weeks = buildWeeks(WINDOW, [gta, film], []);
    const w = weeks.find((x) => x.start === "2026-11-16")!;
    expect(w.releaseKeys).toEqual(["gta6", film.key]);
    expect(w.level).toBe("clash");
    expect(w.peak).toBe(0.9);
    expect(w.peakKey).toBe("gta6");
  });

  it("marks a Steam event only when it covers at least 3 days of the week", () => {
    const weeks = buildWeeks(WINDOW, [], steam);
    expect(weeks.find((w) => w.start === "2026-12-14")!.steamEvents).toEqual(["winter"]); // Dec 17-20 = 4 days
    expect(weeks.find((w) => w.start === "2027-01-04")!.steamEvents).toEqual([]); // only Jan 4
  });
});

describe("picking weeks", () => {
  const gta = scored({ key: "gta6", date: "2026-11-19", affinity: 0.9, level: "clash" });
  const small = scored({ date: "2027-02-04", affinity: 0.5, level: "clear" });
  const mid = scored({ date: "2027-03-04", affinity: 0.7, level: "overlap" });
  const releases = [gta, small, mid];
  const weeks = buildWeeks(WINDOW, releases, steam);

  it("never recommends a red, yellow or Steam-sale week", () => {
    const rec = pickRecommended(weeks, releases, 3);
    expect(rec).toHaveLength(3);
    for (const c of rec) {
      expect(["clear", "open"]).toContain(c.week.level);
      expect(c.week.steamEvents).toHaveLength(0);
    }
  });

  it("keeps recommended weeks away from a strong game two weeks either side", () => {
    const rec = pickRecommended(weeks, releases, 3).map((c) => c.week.start);
    for (const s of ["2026-11-02", "2026-11-09", "2026-11-23", "2026-11-30"]) expect(rec).not.toContain(s);
  });

  it("spreads recommended weeks apart", () => {
    const rec = pickRecommended(weeks, releases, 3).map((c) => c.index);
    for (let i = 1; i < rec.length; i++) expect(rec[i] - rec[i - 1]).toBeGreaterThanOrEqual(2);
  });

  it("puts the red week first among weeks to avoid", () => {
    const avoid = pickAvoid(weeks, releases, 2).map((c) => c.week.start);
    expect(avoid).toContain("2026-11-16");
    expect(avoid).toContain("2027-03-01");
  });

  it("computes pressure from the week and its neighbours", () => {
    const byKey = new Map(releases.map((r) => [r.key, r]));
    const i = weeks.findIndex((w) => w.start === "2026-11-30"); // two weeks after GTA VI
    expect(pressure(i, weeks, byKey)).toBe(0.9);
    const twoBefore = weeks.findIndex((w) => w.start === "2027-01-18"); // a 0.50 game lands two weeks later
    expect(pressure(twoBefore, weeks, byKey)).toBe(0.5);
    const far = weeks.findIndex((w) => w.start === "2027-01-04");
    expect(pressure(far, weeks, byKey)).toBe(0);
  });

  it("ranks scored games from closest to farthest, films excluded", () => {
    const film = scored({ kind: "movie", date: "2026-12-18", affinity: 0.95, level: "overlap" });
    const out = rankGames([small, gta, film, mid]);
    expect(out.find((r) => r.key === "gta6")!.rank).toBe(1);
    expect(out.find((r) => r.key === mid.key)!.rank).toBe(2);
    expect(film.rank).toBeUndefined();
  });
});

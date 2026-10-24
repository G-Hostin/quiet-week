import { describe, expect, it } from "vitest";
import { answerFor, answerLede, defaultWeek, friendlyError, listNames, ordinal, phaseReached, viewFrom, weekReason } from "../lib/present";
import cozy from "../data/examples/cozy-farm.json";
import western from "../data/examples/action-western.json";
import metroid from "../data/examples/metroidvania.json";
import type { Analysis } from "../lib/types";

const W = western as unknown as Analysis;
const C = cozy as unknown as Analysis;
const M = metroid as unknown as Analysis;
const params = (q: string) => new URLSearchParams(q);

describe("answer in one sentence", () => {
  it("follows the GTA VI box: yes for the western, no for the farm and the metroidvania", () => {
    expect(answerFor(W)).toEqual({ tone: "yes", text: "Move away from GTA VI's launch." });
    expect(answerFor(C).tone).toBe("no");
    expect(answerFor(M).tone).toBe("no");
  });

  it("does not talk about GTA VI when it is outside the launch window", () => {
    const late: Analysis = { ...W, releases: W.releases.filter((r) => r.key !== "gta6") };
    expect(answerFor(late)).toEqual({ tone: "unknown", text: "Here are your quietest weeks." });
  });
});

describe("short week reasons", () => {
  it("names the biggest release of a recommended week with its Qloo score", () => {
    const r = weekReason(W.verdict.recommended[0], W, "pick");
    expect(r.text).toBe("Biggest release: Professor Layton and the New World of Steam (0.44)");
    expect(r.weekAfter).toBe(false);
  });

  it("explains a week flagged because GTA VI lands the week before", () => {
    const nov23 = W.verdict.avoid.find((p) => p.weekStart === "2026-11-23")!;
    const r = weekReason(nov23, W, "avoid");
    expect(r.weekAfter).toBe(true);
    expect(r.text).toBe("The week after Grand Theft Auto VI (0.90)");
  });

  it("names the release that makes a week one to avoid", () => {
    const nov16 = W.verdict.avoid.find((p) => p.weekStart === "2026-11-16")!;
    expect(weekReason(nov16, W, "avoid").text).toBe("Grand Theft Auto VI launches (0.90)");
  });

  it("puts the GTA VI number and its rank in plain words", () => {
    expect(answerLede(W)[0]).toContain("0.90 out of 1, the highest of the 22 upcoming games Qloo scored");
    expect(answerLede(W)).toHaveLength(1);
    const farm = answerLede(C);
    expect(farm[0]).toContain("0.55 out of 1, 18th of the 22");
    expect(farm[1]).toMatch(/^The upcoming game closest to your players is /);
  });

  it("only quotes numbers that are in the analysis", () => {
    for (const a of [W, C, M]) {
      const known = new Set(a.releases.map((x) => x.affinity?.toFixed(2)).filter(Boolean));
      for (const [p, k] of [...a.verdict.recommended.map((p) => [p, "pick"] as const), ...a.verdict.avoid.map((p) => [p, "avoid"] as const)]) {
        for (const n of weekReason(p, a, k).text.match(/\d\.\d\d/g) ?? []) expect(known.has(n)).toBe(true);
      }
      for (const n of answerLede(a).join(" ").match(/\d\.\d\d/g) ?? []) expect(known.has(n)).toBe(true);
    }
  });
});

describe("default week and view", () => {
  it("opens on GTA VI's week when it is in the window", () => {
    expect(defaultWeek(W)).toBe("2026-11-16");
  });

  it("falls back to the first recommended week otherwise", () => {
    const noGta: Analysis = { ...C, weeks: C.weeks.map((w) => ({ ...w, releaseKeys: w.releaseKeys.filter((k) => k !== "gta6") })) };
    expect(defaultWeek(noGta)).toBe(C.verdict.recommended[0].weekStart);
  });

  it("reads the screen from the query string", () => {
    const ids = ["cozy-farm", "action-western"];
    expect(viewFrom(params("example=cozy-farm"), ids)).toEqual({ kind: "example", id: "cozy-farm" });
    expect(viewFrom(params("example=nope"), ids)).toEqual({ kind: "tool" });
    expect(viewFrom(params("result=mine"), ids)).toEqual({ kind: "mine" });
    expect(viewFrom(params(""), ids)).toEqual({ kind: "tool" });
  });

  it("moves the agent checklist forward only", () => {
    const phases: ("search" | "check" | "done" | "think" | "warn")[][] = [["search", "think"], ["check", "warn"], ["done"]];
    expect(phaseReached([], phases)).toBe(-1);
    expect(phaseReached([{ kind: "search" }], phases)).toBe(0);
    expect(phaseReached([{ kind: "search" }, { kind: "check" }, { kind: "search" }], phases)).toBe(1);
    expect(phaseReached([{ kind: "warn" }, { kind: "done" }], phases)).toBe(2);
  });

  it("writes ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 18, 21, 22].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "18th", "21st", "22nd"]);
  });

  it("joins names in plain English", () => {
    expect(listNames(["A"])).toBe("A");
    expect(listNames(["A", "B"])).toBe("A and B");
    expect(listNames(["A", "B", "C"])).toBe("A, B and C");
  });
});

describe("error messages a visitor can act on", () => {
  it("never shows raw browser or server wording", () => {
    for (const raw of ["Failed to fetch", "Request failed (HTTP 500)", "Gemini gemini-3.5-flash answered HTTP 503", "Load failed"]) {
      const msg = friendlyError(raw, "analyze");
      expect(msg).not.toMatch(/fetch|HTTP|Gemini|gemini/);
      expect(msg).toMatch(/try again/i);
    }
  });

  it("says busy for rate limits and budget, connection for network errors", () => {
    expect(friendlyError("Too many requests. Try again in a few minutes.", "resolve")).toMatch(/busy/);
    expect(friendlyError("Qloo call budget reached", "analyze")).toMatch(/busy/);
    expect(friendlyError("Failed to fetch", "resolve")).toMatch(/connection/);
  });

  it("names the stage that failed and keeps the server's own input checks", () => {
    expect(friendlyError("boom", "resolve")).toMatch(/searching Qloo/);
    expect(friendlyError("boom", "analyze")).toMatch(/measuring your weeks/);
    expect(friendlyError("Give 1 to 3 game titles.", "resolve")).toBe("Give 1 to 3 game titles.");
  });
});

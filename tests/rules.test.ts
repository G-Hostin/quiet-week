import { describe, expect, it } from "vitest";
import { DEFAULT_RULE, levelFor, maxLevel, ruleSentence } from "../lib/rules";

describe("colour rule", () => {
  it("colours games by fixed affinity thresholds", () => {
    expect(levelFor("game", 0.9)).toBe("clash");
    expect(levelFor("game", DEFAULT_RULE.gameClash)).toBe("clash");
    expect(levelFor("game", 0.7499)).toBe("overlap");
    expect(levelFor("game", DEFAULT_RULE.gameOverlap)).toBe("overlap");
    expect(levelFor("game", 0.6799)).toBe("clear");
    expect(levelFor("game", 0.2)).toBe("clear");
  });

  it("never lets a film turn a week red", () => {
    expect(levelFor("movie", 0.99)).toBe("overlap");
    expect(levelFor("movie", DEFAULT_RULE.movieOverlap)).toBe("overlap");
    expect(levelFor("movie", 0.77)).toBe("clear");
  });

  it("treats a missing score as no signal, not as safe", () => {
    expect(levelFor("game", null)).toBe("open");
    expect(levelFor("movie", null)).toBe("open");
    expect(levelFor("game", Number.NaN)).toBe("open");
  });

  it("takes the worst level of a week", () => {
    expect(maxLevel(["clear", "clash", "overlap"])).toBe("clash");
    expect(maxLevel(["clear", "open"])).toBe("clear");
    expect(maxLevel([])).toBe("open");
  });

  it("states the thresholds in the on-screen sentence", () => {
    const s = ruleSentence();
    expect(s).toContain("0.75");
    expect(s).toContain("0.68");
    expect(s).toContain("0.78");
  });

  it("matches the measured examples: GTA V is red for western players, green for farming players", () => {
    expect(levelFor("game", 0.899)).toBe("clash"); // Red Dead audience -> GTA V
    expect(levelFor("game", 0.553)).toBe("clear"); // Stardew + Animal Crossing audience -> GTA V
  });
});

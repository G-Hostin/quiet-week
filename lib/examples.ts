// Precomputed examples, bundled at build time (no Gemini, no Qloo call needed to show them).
import cozy from "../data/examples/cozy-farm.json";
import western from "../data/examples/action-western.json";
import metroid from "../data/examples/metroidvania.json";
import type { Analysis } from "./types";

export const EXAMPLE_ANALYSES: Analysis[] = [cozy, western, metroid] as unknown as Analysis[];

export function exampleById(id: string): Analysis | undefined {
  return EXAMPLE_ANALYSES.find((a) => a.id === id);
}

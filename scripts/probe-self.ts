// Does Qloo score an entity that is also in the signal? (Hypothesis: no, it is left out of the answer.)
// Run: npx tsx scripts/probe-self.ts
import "./load-env";
import { callCount } from "../lib/qloo";
import { overlap, search, VIDEOGAME } from "../lib/qloo-ops";

(async () => {
  const before = callCount();
  const metro = (await search("Metro Exodus", VIDEOGAME, 3)).hits[0];
  const tomb = (await search("Shadow of the Tomb Raider", VIDEOGAME, 3)).hits[0];
  const stalker = (await search("S.T.A.L.K.E.R. 2: Heart of Chornobyl", VIDEOGAME, 3)).hits[0];
  console.log("ids:", metro.name, "|", tomb.name, "|", stalker.name);
  const a = await overlap([metro.id], [metro.id, tomb.id], VIDEOGAME);
  console.log("signal = Metro Exodus, targets = Metro Exodus + Tomb Raider ->", a.scores.map((s) => `${s.name} ${s.affinity.toFixed(2)}`));
  const b = await overlap([stalker.id], [metro.id, tomb.id], VIDEOGAME);
  console.log("signal = STALKER 2, targets = Metro Exodus + Tomb Raider ->", b.scores.map((s) => `${s.name} ${s.affinity.toFixed(2)}`));
  console.log("Qloo calls used:", callCount() - before);
})();

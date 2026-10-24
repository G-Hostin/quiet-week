// Precompute the three examples against the real Qloo API (and the Gemini agent if configured).
// Run: npm run precompute            (agent on)
//      npm run precompute -- --no-agent
import "./load-env";
import { mkdirSync, writeFileSync } from "node:fs";
import { analyzeAudience } from "../lib/agent/analyze-agent";
import { DEFAULT_WINDOW } from "../lib/data";
import { EXAMPLES } from "../lib/examples-config";
import { geminiCallCount } from "../lib/gemini";
import { callCount } from "../lib/qloo";
import { search, VIDEOGAME } from "../lib/qloo-ops";
import type { AudienceGame } from "../lib/types";

const useAgent = !process.argv.includes("--no-agent");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

(async () => {
  mkdirSync("data/examples", { recursive: true });
  const before = callCount();
  const gBefore = geminiCallCount();
  for (const ex of EXAMPLES) {
    if (only && ex.id !== only) continue;
    const audience: AudienceGame[] = [];
    for (const t of ex.titles) {
      const { hits } = await search(t, VIDEOGAME, 5);
      const hit = hits.find((h) => h.name.toLowerCase() === t.toLowerCase()) || hits[0];
      audience.push({ id: hit.id, name: hit.name, image: hit.image, year: hit.releaseDate?.slice(0, 4) });
    }
    const a = await analyzeAudience(
      { id: ex.id, label: ex.label, pitch: ex.pitch, mode: "example", audience, window: DEFAULT_WINDOW },
      (s) => console.log(`  [${(s.ms / 1000).toFixed(1)}s] ${s.kind.padEnd(7)} ${s.text}`),
      useAgent,
    );
    writeFileSync(`data/examples/${ex.id}.json`, JSON.stringify(a, null, 1));
    const gta = a.verdict.gta;
    console.log(`## ${ex.id}: GTA ${gta.answer} ${gta.affinity?.toFixed(2)} | weeks ${a.weeks.map((w) => w.level[0]).join("")} | summary by ${a.verdict.summaryBy}`);
    console.log(`   recommended ${a.verdict.recommended.map((p) => p.weekStart).join(", ")} | avoid ${a.verdict.avoid.map((p) => p.weekStart).join(", ")}`);
    console.log(`   ${a.verdict.summary}`);
  }
  console.log("New Qloo calls this run:", callCount() - before, "| total:", callCount());
  console.log("Gemini calls this run:", geminiCallCount() - gBefore, "| total:", geminiCallCount());
})();

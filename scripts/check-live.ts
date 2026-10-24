// Live check: run the three examples end to end against the real APIs, locally.
// 1) resolve the typed titles with the agent (Qloo search + audience check),
// 2) analyse with the agent, forcing fresh Qloo insights calls (QLOO_NO_CACHE=1 for this step),
// 3) assert each one renders a verdict. Exit code 1 on failure.
// Run: npm run check:live
import "./load-env";
import { analyzeAudience } from "../lib/agent/analyze-agent";
import { resolveTitles } from "../lib/agent/resolve-agent";
import { DEFAULT_WINDOW } from "../lib/data";
import { EXAMPLES } from "../lib/examples-config";
import { geminiCallCount } from "../lib/gemini";
import { callCount } from "../lib/qloo";
import type { AudienceGame } from "../lib/types";

(async () => {
  const q0 = callCount();
  const g0 = geminiCallCount();
  let failures = 0;
  for (const ex of EXAMPLES) {
    const t0 = Date.now();
    const r = await resolveTitles(ex.titles);
    const audience: AudienceGame[] = [];
    for (const m of r.matches) {
      const h = m.candidates.find((c) => c.id === m.pickedId);
      if (h) audience.push({ id: h.id, name: h.name, image: h.image, year: h.releaseDate?.slice(0, 4) });
    }
    const resolvedOk = audience.length === ex.titles.length && audience.every((a, i) => a.name.toLowerCase() === ex.titles[i].toLowerCase());
    process.env.QLOO_NO_CACHE = "1";
    const a = await analyzeAudience({ id: ex.id, label: ex.label, pitch: ex.pitch, mode: "live", audience, window: DEFAULT_WINDOW });
    delete process.env.QLOO_NO_CACHE;
    const v = a.verdict;
    const ok =
      resolvedOk &&
      a.weeks.length > 0 &&
      v.recommended.length === 3 &&
      v.avoid.length === 2 &&
      v.gta.affinity !== null &&
      a.evidence.calls.every((c) => c.status === 200) &&
      v.summary.length > 40;
    if (!ok) failures++;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${ex.id}: resolved=[${audience.map((x) => x.name).join(", ")}] by ${r.by}; ` +
        `GTA ${v.gta.answer} ${v.gta.affinity?.toFixed(2)}; best ${v.recommended.map((p) => p.weekStart).join(", ")}; ` +
        `avoid ${v.avoid.map((p) => p.weekStart).join(", ")}; summary by ${v.summaryBy}; ` +
        `${a.evidence.calls.length} insights calls (${a.stats.qlooCalls} fresh); ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
    console.log(`     ${v.summary}`);
  }
  console.log(`Qloo calls this run: ${callCount() - q0} (total ${callCount()}); Gemini calls this run: ${geminiCallCount() - g0} (total ${geminiCallCount()})`);
  process.exit(failures ? 1 : 0);
})();

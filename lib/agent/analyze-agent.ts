// Agent phase 2: measure every release against the confirmed audience, swap in stand-ins,
// build the calendar, then write the verdict from Qloo numbers only.
import { geminiConfigured } from "../gemini";
import { DEFAULT_RULE } from "../rules";
import type { Analysis, AudienceGame, Step } from "../types";
import { analyzeTools } from "./analyze-tools";
import { makeEmitter, runLoop } from "./loop";
import { analyzeSystem } from "./prompts";
import { countLevel, Session } from "./session";

export interface AnalyzeInput {
  id: string;
  label: string;
  pitch: string;
  mode: "example" | "live";
  audience: AudienceGame[];
  window: { start: string; end: string };
}

export async function analyzeAudience(input: AnalyzeInput, push?: (s: Step) => void, useAgent = true): Promise<Analysis> {
  const t0 = Date.now();
  const steps: Step[] = [];
  const emit = makeEmitter(steps, t0, push);
  const s = new Session(input.audience.map((a) => a.id), input.window, emit, input.audience);
  const tools = analyzeTools(s);
  const names = input.audience.map((a) => a.name);
  emit("think", `Audience: players of ${names.join(", ")}`);

  let geminiCalls = 0;
  let model: string | null = null;
  if (useAgent && geminiConfigured()) {
    try {
      const r = await runLoop({
        system: analyzeSystem(names),
        user: `Audience games: ${names.join(", ")}. Window: ${input.window.start} to ${input.window.end}.`,
        tools,
        emit,
        maxTurns: 12,
        isDone: () => s.summary !== null,
      });
      geminiCalls = r.geminiCalls;
      model = r.model;
    } catch (e) {
      emit("warn", `Agent unavailable (${(e as Error).message}); finishing with the fixed pipeline`);
    }
  }
  if (!s.built) {
    // The agent stopped early or is not configured: run the same steps deterministically.
    if (!s.calls.length) await tools[1].run({});
    await s.completeMissing();
    const b = s.build();
    emit("compute", `Coloured ${b.weeks.length} weeks: ${countLevel(b.weeks, "clash")} red, ${countLevel(b.weeks, "overlap")} yellow, ${countLevel(b.weeks, "clear")} green`);
  }
  const b = s.built!;
  const fresh = s.calls.filter((c) => !c.cached).length;
  emit("done", `Done: ${s.calls.length} Qloo calls${geminiCalls ? `, ${geminiCalls} agent turns` : ""}`);
  return {
    id: input.id,
    label: input.label,
    pitch: input.pitch,
    mode: input.mode,
    createdAt: new Date().toISOString(),
    audience: input.audience,
    window: input.window,
    releases: b.scored,
    weeks: b.weeks,
    verdict: { ...b.verdict, summary: s.summary ?? b.verdict.summary, summaryBy: s.summary ? "agent" : "template" },
    evidence: { calls: s.calls, names: s.names, rule: DEFAULT_RULE },
    steps,
    stats: { qlooCalls: fresh, qlooCached: s.calls.length - fresh, geminiCalls, seconds: Math.round((Date.now() - t0) / 100) / 10, model },
  };
}

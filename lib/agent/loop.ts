// Generic Gemini tool-calling loop. Tools run on the server; the model only sees
// game titles, dates and Qloo numbers (never the user's pitch, never keys).
import { generate, type FunctionDeclaration, type GeminiContent, type GeminiPart } from "../gemini";
import type { Step, StepKind } from "../types";

export type Emit = (kind: StepKind, text: string, detail?: string) => void;

export interface Tool {
  decl: FunctionDeclaration;
  run: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface LoopResult {
  finalText: string;
  turns: number;
  model: string | null;
  geminiCalls: number;
}

export function makeEmitter(steps: Step[], t0: number, push?: (s: Step) => void): Emit {
  return (kind, text, detail) => {
    const s: Step = { ms: Date.now() - t0, kind, text, ...(detail ? { detail } : {}) };
    steps.push(s);
    push?.(s);
  };
}

function shorten(t: string, n = 260): string {
  const one = t.replace(/\s+/g, " ").trim();
  return one.length > n ? one.slice(0, n - 1) + "…" : one;
}

/**
 * Run the model until it stops calling tools, a tool sets `done`, or maxTurns is hit.
 * Text the model writes between tool calls is shown in the journal as "think" steps.
 */
export async function runLoop(opts: {
  system: string;
  user: string;
  tools: Tool[];
  emit: Emit;
  maxTurns: number;
  isDone: () => boolean;
}): Promise<LoopResult> {
  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: opts.user }] }];
  const byName = new Map(opts.tools.map((t) => [t.decl.name, t]));
  let finalText = "";
  let model: string | null = null;
  let calls = 0;
  for (let turn = 0; turn < opts.maxTurns; turn++) {
    const { content, model: m } = await generate(opts.system, contents, opts.tools.map((t) => t.decl));
    calls++;
    model = m;
    contents.push(content);
    const texts = content.parts.filter((p) => typeof p.text === "string" && p.text.trim() && !p.thought);
    for (const p of texts) opts.emit("think", shorten(p.text as string));
    const fcs = content.parts.filter((p) => p.functionCall);
    if (!fcs.length) {
      finalText = texts.map((p) => p.text).join(" ").trim();
      return { finalText, turns: turn + 1, model, geminiCalls: calls };
    }
    const responses: GeminiPart[] = [];
    for (const p of fcs) {
      const fc = p.functionCall!;
      const tool = byName.get(fc.name);
      let response: Record<string, unknown>;
      if (!tool) response = { error: `Unknown tool ${fc.name}` };
      else {
        try {
          response = await tool.run(fc.args || {});
        } catch (e) {
          response = { error: (e as Error).message };
          opts.emit("warn", `Tool ${fc.name} failed: ${(e as Error).message}`);
        }
      }
      responses.push({ functionResponse: { name: fc.name, response, ...(fc.id ? { id: fc.id } : {}) } });
    }
    contents.push({ role: "user", parts: responses });
    if (opts.isDone()) return { finalText, turns: turn + 1, model, geminiCalls: calls };
  }
  return { finalText, turns: opts.maxTurns, model, geminiCalls: calls };
}

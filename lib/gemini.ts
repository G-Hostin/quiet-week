// Minimal Gemini REST client (server only). Reads GEMINI_API_KEY; never logs it.
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 25_000;

export interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: Record<string, unknown>; id?: string };
  thoughtSignature?: string;
  [k: string]: unknown;
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export class GeminiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function counterPath(): string {
  const base = process.env.VERCEL ? "/tmp" : process.cwd();
  const dir = path.join(base, ".cache");
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  return path.join(dir, "gemini-calls.log");
}

export function geminiCallCount(): number {
  try {
    return readFileSync(counterPath(), "utf8").split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

function logCall(model: string, status: number) {
  try {
    appendFileSync(counterPath(), `${new Date().toISOString()} ${model} ${status}\n`);
  } catch {
    /* ignore */
  }
}

export function geminiModels(): string[] {
  const a = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const b = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";
  return a === b ? [a] : [a, b];
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** One generateContent call; tries the main model, then the fallback on error. */
export async function generate(
  system: string,
  contents: GeminiContent[],
  tools: FunctionDeclaration[],
): Promise<{ content: GeminiContent; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set on the server", 500);
  let lastErr: GeminiError | null = null;
  for (const model of geminiModels()) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          tools: tools.length ? [{ functionDeclarations: tools }] : undefined,
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
        signal: ctrl.signal,
        cache: "no-store",
      });
      logCall(model, res.status);
      const j: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastErr = new GeminiError(`Gemini ${model} answered HTTP ${res.status}`, res.status);
        continue;
      }
      const content = j?.candidates?.[0]?.content as GeminiContent | undefined;
      if (!content || !Array.isArray(content.parts)) {
        lastErr = new GeminiError(`Gemini ${model} returned no content`, 502);
        continue;
      }
      return { content: { role: "model", parts: content.parts }, model };
    } catch (e) {
      logCall(model, 0);
      lastErr = new GeminiError(`Gemini ${model}: ${(e as Error).name}`, 0);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr ?? new GeminiError("Gemini failed", 0);
}

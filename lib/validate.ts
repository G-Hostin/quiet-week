// Input checks for the API routes, plus a small per-IP rate limit.
import type { AudienceGame } from "./types";

const UUID = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const WINDOW_MIN = "2026-11-01";
export const WINDOW_MAX = "2027-03-31";

export function cleanTitles(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const titles = input
    .map((t) => String(t ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80))
    .filter(Boolean);
  if (titles.length < 1 || titles.length > 3) return null;
  return titles;
}

export function cleanAudience(input: unknown): AudienceGame[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 3) return null;
  const out: AudienceGame[] = [];
  for (const a of input) {
    if (!a || typeof a !== "object") return null;
    const id = String((a as any).id || "");
    if (!UUID.test(id)) return null;
    const image = String((a as any).image || "");
    out.push({
      id,
      name: String((a as any).name || "").slice(0, 120),
      image: image.startsWith("https://images.qloo.com/") ? image : undefined,
      year: String((a as any).year || "").slice(0, 4) || undefined,
    });
  }
  return out;
}

export function cleanWindow(input: unknown): { start: string; end: string } {
  const w = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  let start = DAY.test(String(w.start)) ? String(w.start) : WINDOW_MIN;
  let end = DAY.test(String(w.end)) ? String(w.end) : WINDOW_MAX;
  if (start < WINDOW_MIN) start = WINDOW_MIN;
  if (end > WINDOW_MAX) end = WINDOW_MAX;
  if (end < start) [start, end] = [WINDOW_MIN, WINDOW_MAX];
  return { start, end };
}

export function cleanPitch(input: unknown): string {
  return String(input ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 240);
}

const hits = new Map<string, number[]>();
/** At most `limit` requests per `windowMs` per client address. */
export function rateLimited(req: Request, limit = 12, windowMs = 10 * 60_000): boolean {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

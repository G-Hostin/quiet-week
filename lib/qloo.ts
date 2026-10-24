// Server-side Qloo client with a file + memory cache and a hard call budget.
// Never import this file from a client component: it reads QLOO_API_KEY.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

export const QLOO_BASE = "https://hackathon.api.qloo.com";
const TIMEOUT_MS = 25_000;
const BUDGET = Number(process.env.QLOO_CALL_BUDGET || 1500);

export interface QlooEntity {
  name: string;
  entity_id: string;
  subtype?: string;
  popularity?: number;
  query?: { affinity?: number };
  properties?: {
    release_date?: string;
    release_year?: number;
    image?: { url?: string };
    genre?: string[];
    developer?: string;
    publisher?: string;
    platforms?: string[];
    short_description?: string;
    description?: string;
  };
}

import type { QlooCallRecord } from "./qloo-record";
export type { QlooCallRecord };

interface CacheEntry {
  status: number;
  body: unknown;
  at: string;
}

const memory = new Map<string, CacheEntry>();

function cacheDir(): string {
  const base = process.env.VERCEL ? "/tmp" : process.cwd();
  const dir = path.join(base, ".cache", "qloo");
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    /* read-only filesystem: memory cache only */
  }
  return dir;
}

function counterFile(): string {
  return path.join(cacheDir(), "..", "qloo-count.json");
}

export function callCount(): number {
  try {
    return JSON.parse(readFileSync(counterFile(), "utf8")).count || 0;
  } catch {
    return 0;
  }
}

function bumpCount(): number {
  const n = callCount() + 1;
  try {
    writeFileSync(counterFile(), JSON.stringify({ count: n, updated: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
  return n;
}

export function buildUrl(p: string, params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const qs = new URLSearchParams();
  for (const k of keys) qs.set(k, params[k]);
  return `${QLOO_BASE}${p}?${qs.toString()}`;
}

function cacheKey(url: string): string {
  return createHash("sha1").update(url).digest("hex");
}

// Simple concurrency gate: at most 4 requests in flight (API limit is 10 req/s).
let inFlight = 0;
const waiters: Array<() => void> = [];
async function acquire() {
  if (inFlight < 4) {
    inFlight++;
    return;
  }
  await new Promise<void>((r) => waiters.push(r));
  inFlight++;
}
function release() {
  inFlight--;
  const next = waiters.shift();
  if (next) next();
}

export class QlooError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** GET a Qloo endpoint, cached forever by exact URL. */
export async function qlooGet(
  p: string,
  params: Record<string, string>,
): Promise<{ body: any; record: QlooCallRecord }> {
  const url = buildUrl(p, params);
  const key = cacheKey(url);
  const file = path.join(cacheDir(), `${key}.json`);
  // QLOO_NO_CACHE=1 forces a fresh call (used by the live check script); answers are still cached after.
  const noCache = process.env.QLOO_NO_CACHE === "1";
  let hit = noCache ? undefined : memory.get(key);
  if (!hit && !noCache && existsSync(file)) {
    try {
      hit = JSON.parse(readFileSync(file, "utf8")) as CacheEntry;
      memory.set(key, hit);
    } catch {
      hit = undefined;
    }
  }
  if (hit) {
    return { body: hit.body, record: makeRecord(p, params, url, hit.status, true, 0, hit.at, hit.body) };
  }
  const apiKey = process.env.QLOO_API_KEY;
  if (!apiKey) throw new QlooError("QLOO_API_KEY is not set on the server", 500);
  if (callCount() >= BUDGET) throw new QlooError("Qloo call budget reached", 429);

  await acquire();
  const t0 = Date.now();
  let status = 0;
  let body: any = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "X-Api-Key": apiKey, Accept: "application/json" },
        signal: ctrl.signal,
        cache: "no-store",
      });
      status = res.status;
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: "non-JSON response" };
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    status = 0;
    body = { error: (e as Error).name || "network error" };
  } finally {
    release();
    bumpCount();
  }
  const ms = Date.now() - t0;
  const at = new Date().toISOString();
  if (status === 200) {
    const entry: CacheEntry = { status, body, at };
    memory.set(key, entry);
    try {
      writeFileSync(file, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
  const record = makeRecord(p, params, url, status, false, ms, at, body);
  if (status !== 200) {
    throw Object.assign(new QlooError(`Qloo ${p} answered HTTP ${status}`, status), { record });
  }
  return { body, record };
}

function makeRecord(
  p: string,
  params: Record<string, string>,
  url: string,
  status: number,
  cached: boolean,
  ms: number,
  at: string,
  body: any,
): QlooCallRecord {
  return { path: p, params, url, status, cached, ms, at, resultCount: entitiesOf(body).length };
}

export function entitiesOf(body: any): QlooEntity[] {
  if (!body) return [];
  const r = body.results;
  if (Array.isArray(r)) return r;
  if (r && Array.isArray(r.entities)) return r.entities;
  return [];
}

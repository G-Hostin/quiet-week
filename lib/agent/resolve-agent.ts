// Agent phase 1: turn typed titles into confirmed Qloo game entities.
import { overlap, search, VIDEOGAME, type SearchHit } from "../qloo-ops";
import type { QlooCallRecord } from "../qloo-record";
import { geminiConfigured } from "../gemini";
import type { Step } from "../types";
import { makeEmitter, runLoop, type Emit, type Tool } from "./loop";

export interface Match {
  typed: string;
  candidates: SearchHit[];
  pickedId: string | null;
  note: string;
  audienceData: boolean | null;
}

export interface ResolveResult {
  matches: Match[];
  steps: Step[];
  calls: QlooCallRecord[];
  geminiCalls: number;
  model: string | null;
  by: "agent" | "direct";
}

// Well-known games used only to test whether Qloo has audience data for a title.
const ANCHORS = [
  "FEFD4E0D-D8F2-4BF9-86C9-06949DE82BCD", // Grand Theft Auto V
  "875DB771-9C4C-4DD0-9249-D2ABD95711F1", // Stardew Valley
  "F4370AF5-3171-48C7-95DB-38ED25B1F80C", // Hollow Knight
  "0ED6691B-1F06-46D7-8F17-DB18826A5D0F", // Red Dead Redemption 2
  "08663BD2-E267-4C7F-9895-86410F67867C", // Animal Crossing: New Horizons
];

const SYSTEM = `You are the resolver of Quiet Week, a launch-date tool for indie game studios.
The user typed the titles of 1 to 3 well-known games whose players resemble theirs.
For each typed title:
1. Call search_games with the title. If nothing fits (wrong game, DLC, soundtrack), search again once with a corrected or fuller title.
2. Pick the base game (not a DLC, edition or bundle) that matches what the user meant.
3. Call check_audience_data on your pick. If Qloo has no audience data for it, say so in the note and suggest, in the note, one better-known game with similar players.
Then call propose_matches once with one entry per typed title, using only ids returned by search_games (id null if nothing fits).
Keep notes under 20 words, plain English. Never invent ids or numbers.`;

export async function resolveTitles(titles: string[], push?: (s: Step) => void): Promise<ResolveResult> {
  const t0 = Date.now();
  const steps: Step[] = [];
  const emit = makeEmitter(steps, t0, push);
  const calls: QlooCallRecord[] = [];
  const seen = new Map<string, SearchHit[]>(); // query -> hits
  const dataById = new Map<string, boolean>();
  let proposed: Match[] | null = null;

  const searchTool: Tool = {
    decl: {
      name: "search_games",
      description: "Search Qloo's catalogue of video games by title. Returns up to 5 candidates.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
    run: async (args) => {
      const q = String(args.query || "").slice(0, 80);
      emit("search", `Searching Qloo for “${q}”`);
      const { hits, record } = await search(q, VIDEOGAME, 5);
      calls.push(record);
      seen.set(q, hits);
      emit("check", hits.length ? `Found ${hits.length}: ${hits.slice(0, 3).map((h) => label(h)).join(", ")}` : `Nothing found for “${q}”`);
      return { results: hits.map((h) => ({ id: h.id, name: h.name, year: h.releaseDate?.slice(0, 4), developer: h.developer })) };
    },
  };

  const checkTool: Tool = {
    decl: {
      name: "check_audience_data",
      description: "Check whether Qloo has enough audience data on a game to compare its players with other releases.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
    run: async (args) => {
      const id = String(args.id || "");
      const ok = await hasAudienceData(id, calls);
      dataById.set(id, ok);
      const name = findHit(seen, id)?.name || id;
      emit(ok ? "check" : "warn", ok ? `${name}: Qloo has audience data` : `${name}: Qloo has no audience data for this game`);
      return { has_data: ok };
    },
  };

  const proposeTool: Tool = {
    decl: {
      name: "propose_matches",
      description: "Submit one match per typed title for the user to confirm.",
      parameters: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: { typed: { type: "string" }, id: { type: "string", nullable: true }, note: { type: "string" } },
              required: ["typed", "note"],
            },
          },
        },
        required: ["matches"],
      },
    },
    run: async (args) => {
      const list = Array.isArray(args.matches) ? (args.matches as any[]) : [];
      proposed = titles.map((typed) => {
        const m = list.find((x) => norm(x.typed) === norm(typed)) || list[titles.indexOf(typed)] || {};
        const id = m.id && findHit(seen, m.id) ? String(m.id) : null;
        const candidates = id ? listContaining(seen, id) : [...seen.entries()].find(([q]) => norm(q) === norm(typed))?.[1] || [];
        return { typed, candidates, pickedId: id, note: String(m.note || "").slice(0, 160), audienceData: id ? dataById.get(id) ?? null : null };
      });
      emit("done", "Matches ready for your confirmation");
      return { ok: true };
    },
  };

  let geminiCalls = 0;
  let model: string | null = null;
  let by: "agent" | "direct" = "agent";
  if (geminiConfigured()) {
    try {
      const r = await runLoop({
        system: SYSTEM,
        user: `Typed titles: ${JSON.stringify(titles)}`,
        tools: [searchTool, checkTool, proposeTool],
        emit,
        maxTurns: 10,
        isDone: () => proposed !== null,
      });
      geminiCalls = r.geminiCalls;
      model = r.model;
    } catch (e) {
      emit("warn", `Agent unavailable (${(e as Error).message}); searching directly`);
    }
  }
  if (!proposed) {
    by = "direct";
    proposed = await directResolve(titles, emit, calls);
  }
  return { matches: proposed, steps, calls, geminiCalls, model, by };
}

export async function hasAudienceData(id: string, calls: QlooCallRecord[]): Promise<boolean> {
  const targets = ANCHORS.filter((a) => a !== id).slice(0, 4);
  const { scores, record } = await overlap([id], targets, VIDEOGAME);
  calls.push(record);
  return scores.length > 0;
}

async function directResolve(titles: string[], emit: Emit, calls: QlooCallRecord[]): Promise<Match[]> {
  const out: Match[] = [];
  for (const typed of titles) {
    emit("search", `Searching Qloo for “${typed}”`);
    const { hits, record } = await search(typed, VIDEOGAME, 5);
    calls.push(record);
    const pick = hits[0];
    const ok = pick ? await hasAudienceData(pick.id, calls) : null;
    out.push({ typed, candidates: hits, pickedId: pick?.id ?? null, note: pick ? "First Qloo result; please confirm." : "Not found in Qloo.", audienceData: ok });
  }
  emit("done", "Matches ready for your confirmation");
  return out;
}

function label(h: SearchHit): string {
  return h.releaseDate ? `${h.name} (${h.releaseDate.slice(0, 4)})` : h.name;
}
function norm(s: unknown): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function findHit(seen: Map<string, SearchHit[]>, id: string): SearchHit | undefined {
  for (const hits of seen.values()) {
    const h = hits.find((x) => x.id === id);
    if (h) return h;
  }
  return undefined;
}
function listContaining(seen: Map<string, SearchHit[]>, id: string): SearchHit[] {
  for (const hits of [...seen.values()].reverse()) if (hits.some((h) => h.id === id)) return hits;
  return [];
}

// High-level Qloo operations used by the agent tools and the precompute script.
import { qlooGet, entitiesOf, type QlooCallRecord, type QlooEntity } from "./qloo";

export const VIDEOGAME = "urn:entity:videogame";
export const MOVIE = "urn:entity:movie";
export const TV = "urn:entity:tv_show";
export type EntityType = typeof VIDEOGAME | typeof MOVIE | typeof TV;

export interface SearchHit {
  id: string;
  name: string;
  type: string;
  releaseDate?: string;
  image?: string;
  popularity?: number;
  developer?: string;
  genre?: string[];
}

export function toHit(e: QlooEntity): SearchHit {
  const p = e.properties || {};
  return {
    id: e.entity_id,
    name: e.name,
    type: e.subtype || "",
    releaseDate: p.release_date || (p.release_year ? String(p.release_year) : undefined),
    image: p.image?.url,
    popularity: e.popularity,
    developer: p.developer,
    genre: p.genre?.slice(0, 3),
  };
}

/** GET /search — find entities by title. */
export async function search(
  query: string,
  type: EntityType = VIDEOGAME,
  take = 5,
): Promise<{ hits: SearchHit[]; record: QlooCallRecord }> {
  const { body, record } = await qlooGet("/search", { query, types: type, take: String(take) });
  return { hits: entitiesOf(body).map(toHit), record };
}

export interface AffinityScore {
  id: string;
  name: string;
  affinity: number;
  image?: string;
}

/**
 * GET /v2/insights — audience overlap. Signal = the reference games (the user's audience),
 * filter.entities = the releases to score. Returns one affinity (0..1) per scored entity;
 * entities Qloo cannot score are simply absent from the answer.
 */
export async function overlap(
  signalIds: string[],
  targetIds: string[],
  type: EntityType,
): Promise<{ scores: AffinityScore[]; record: QlooCallRecord }> {
  // filter.results.entities is the current name of the deprecated filter.entities (same behaviour, tested).
  const params: Record<string, string> = {
    "filter.type": type,
    "signal.interests.entities": signalIds.join(","),
    "filter.results.entities": targetIds.join(","),
    take: String(Math.max(targetIds.length, 1)),
  };
  const { body, record } = await qlooGet("/v2/insights", params);
  const scores = entitiesOf(body)
    .filter((e) => typeof e.query?.affinity === "number")
    .map((e) => ({
      id: e.entity_id,
      name: e.name,
      affinity: e.query!.affinity as number,
      image: e.properties?.image?.url,
    }));
  return { scores, record };
}

/** Split into chunks — used when more targets than one call accepts. */
export function chunk<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

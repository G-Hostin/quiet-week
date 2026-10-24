// Probe Qloo behaviour: search a list of titles, then test filter.entities size and multi-signal.
// Run: npx tsx scripts/probe.ts <step>  (step = search | multi)
import "./load-env";
import { writeFileSync, mkdirSync } from "node:fs";
import { search, overlap, VIDEOGAME, MOVIE, type EntityType } from "../lib/qloo-ops";
import { callCount } from "../lib/qloo";

const step = process.argv[2] || "search";
mkdirSync("data/probe", { recursive: true });

async function doSearch(file: string, type: EntityType) {
  const titles: string[] = JSON.parse((await import("node:fs")).readFileSync(file, "utf8"));
  const out: Record<string, unknown> = {};
  for (const t of titles) {
    try {
      const { hits } = await search(t, type, 4);
      out[t] = hits.map((h) => ({ id: h.id, name: h.name, date: h.releaseDate, img: !!h.image, pop: h.popularity }));
      console.log("#", t);
      for (const h of hits) console.log("   ", h.name, "|", h.id, "|", h.releaseDate, "| img", !!h.image);
    } catch (e) {
      console.log("#", t, "ERROR", (e as Error).message);
    }
  }
  writeFileSync(`data/probe/search-${type.split(":").pop()}.json`, JSON.stringify(out, null, 1));
}

async function doMulti() {
  const ids = JSON.parse((await import("node:fs")).readFileSync("data/probe/multi-input.json", "utf8"));
  for (const t of ids.tests) {
    try {
      const { scores, record } = await overlap(t.signal, t.targets, t.type);
      console.log("##", t.name, "targets", t.targets.length, "-> scored", scores.length, "status", record.status);
      for (const s of scores) console.log("   ", s.name, s.affinity.toFixed(3));
    } catch (e) {
      console.log("##", t.name, "ERROR", (e as Error).message);
    }
  }
}

(async () => {
  if (step === "search") await doSearch(process.argv[3], (process.argv[4] as EntityType) || VIDEOGAME);
  if (step === "multi") await doMulti();
  console.log("Qloo calls so far:", callCount());
})();
void MOVIE;

// Genre sweep: run the real analysis (Qloo scores, fixed pipeline, no Gemini) for many audiences
// and check that the closest upcoming game is the one a games expert would expect.
// Run: npx tsx scripts/sweep.ts [outFile] [--only=id,id]
import "./load-env";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { analyzeAudience } from "../lib/agent/analyze-agent";
import { DEFAULT_WINDOW } from "../lib/data";
import { callCount } from "../lib/qloo";
import { search, VIDEOGAME } from "../lib/qloo-ops";
import type { AudienceGame } from "../lib/types";

type Case = { id: string; titles: string[]; expect: string[] };

// expect = upcoming releases (title substrings) that should rank among the closest games; [] = no obvious match.
const CASES: Case[] = [
  { id: "open-world-crime", titles: ["Saints Row: The Third", "Watch Dogs 2", "Mafia: Definitive Edition"], expect: ["Grand Theft Auto VI"] },
  { id: "racing-arcade", titles: ["Forza Horizon 5", "Need for Speed Heat"], expect: ["Forza Horizon 6"] },
  { id: "racing-sim", titles: ["Gran Turismo 7", "Assetto Corsa"], expect: ["Forza Horizon 6"] },
  { id: "football-manager", titles: ["Football Manager 2024", "Motorsport Manager"], expect: ["Football Manager 27"] },
  { id: "football-sim", titles: ["FIFA 23", "eFootball 2024"], expect: ["Football Manager 27"] },
  { id: "jrpg-persona", titles: ["Persona 5 Royal", "Final Fantasy X"], expect: ["Persona 4 Revival", "Metaphor"] },
  { id: "monster-collect", titles: ["Pokémon Scarlet", "Digimon Story Cyber Sleuth"], expect: ["Dragon Quest Monsters"] },
  { id: "rts", titles: ["Age of Empires II", "StarCraft II: Wings of Liberty", "Company of Heroes 3"], expect: ["Dawn of War IV"] },
  { id: "4x-strategy", titles: ["Sid Meier's Civilization VI", "Stellaris"], expect: ["Dawn of War IV"] },
  { id: "mmo", titles: ["Final Fantasy XIV", "Guild Wars 2"], expect: ["World of Warcraft"] },
  { id: "arpg", titles: ["Diablo IV", "Grim Dawn"], expect: ["Path of Exile 2"] },
  { id: "soulslike", titles: ["Elden Ring", "Nioh 2", "Sekiro: Shadows Die Twice"], expect: ["Wo Long 2"] },
  { id: "monster-hunting", titles: ["Monster Hunter: World", "Dauntless"], expect: ["Monster Hunter Wilds"] },
  { id: "horror-narrative", titles: ["Until Dawn", "The Quarry", "The Dark Pictures Anthology: Man of Medan"], expect: ["Until Dawn 2"] },
  { id: "survival-horror", titles: ["Resident Evil Village", "Dead Space"], expect: ["Until Dawn 2"] },
  { id: "fps-story", titles: ["Metro Exodus", "S.T.A.L.K.E.R. 2: Heart of Chornobyl"], expect: ["Metro 2039"] },
  { id: "fps-competitive", titles: ["Counter-Strike 2", "Valorant"], expect: [] },
  { id: "battle-royale", titles: ["Fortnite", "Apex Legends"], expect: [] },
  { id: "action-adventure", titles: ["Uncharted 4: A Thief's End", "Shadow of the Tomb Raider"], expect: ["Tomb Raider"] },
  { id: "character-action", titles: ["God of War Ragnarök", "Devil May Cry 5"], expect: ["God of War Laufey"] },
  { id: "zelda-like", titles: ["The Legend of Zelda: Breath of the Wild", "Okami"], expect: ["Zelda"] },
  { id: "nintendo-family", titles: ["Mario Kart 8 Deluxe", "Super Mario Odyssey"], expect: ["Zelda", "Pikmin"] },
  { id: "cozy-life", titles: ["Disney Dreamlight Valley", "My Time at Portia"], expect: ["Grave Seasons"] },
  { id: "puzzle-adventure", titles: ["Professor Layton and the Curious Village", "Phoenix Wright: Ace Attorney"], expect: ["Professor Layton"] },
  { id: "coop-platformer", titles: ["It Takes Two", "Trine 4: The Nightmare Prince"], expect: ["Trine 6"] },
  { id: "roguelike-deck", titles: ["Slay the Spire", "Balatro"], expect: [] },
  { id: "survival-craft", titles: ["Valheim", "Rust", "The Forest"], expect: [] },
  { id: "city-builder", titles: ["Cities: Skylines", "Frostpunk"], expect: [] },
  { id: "western-rpg", titles: ["The Elder Scrolls V: Skyrim", "Fable III", "Dragon Age: Inquisition"], expect: ["Fable"] },
  { id: "yakuza", titles: ["Yakuza 0", "Like a Dragon: Infinite Wealth"], expect: ["Stranger Than Heaven"] },
  { id: "visual-novel", titles: ["Doki Doki Literature Club!", "Steins;Gate"], expect: [] },
  { id: "rhythm", titles: ["Beat Saber", "Guitar Hero III: Legends of Rock"], expect: [] },
  { id: "lego-kids", titles: ["LEGO Star Wars: The Skywalker Saga", "Minecraft"], expect: [] },
  { id: "pikmin-like", titles: ["Pikmin 3 Deluxe", "Overcooked! 2"], expect: ["Pikmin"] },
  { id: "fighting", titles: ["Street Fighter 6", "Tekken 8"], expect: [] },
  { id: "sim-vehicles", titles: ["Microsoft Flight Simulator", "Euro Truck Simulator 2"], expect: [] },
  { id: "warhammer", titles: ["Warhammer 40,000: Space Marine 2", "Warhammer 40,000: Dawn of War II"], expect: ["Dawn of War IV"] },
  { id: "metroidvania-2d", titles: ["Hollow Knight", "Metroid Dread"], expect: ["Metroid Ravenous"] },
  { id: "gta-fan", titles: ["Grand Theft Auto V"], expect: ["Grand Theft Auto VI"] },
  { id: "gta-plus-rdr", titles: ["Grand Theft Auto V", "Red Dead Redemption 2"], expect: ["Grand Theft Auto VI"] },
];

const out = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : ".cache/sweep.jsonl";
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const done = new Set(existsSync(out) ? readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id) : []);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

(async () => {
  const before = callCount();
  for (const c of CASES) {
    if (only && !only.includes(c.id)) continue;
    if (done.has(c.id)) continue;
    const t0 = Date.now();
    const audience: AudienceGame[] = [];
    const picks: string[] = [];
    for (const t of c.titles) {
      const { hits } = await search(t, VIDEOGAME, 5);
      const hit = hits.find((h) => norm(h.name) === norm(t)) || hits[0];
      if (!hit) { picks.push(`${t} -> NOT FOUND`); continue; }
      picks.push(`${t} -> ${hit.name}${norm(hit.name) === norm(t) ? "" : " (closest)"}`);
      if (!audience.some((a) => a.id === hit.id)) audience.push({ id: hit.id, name: hit.name, year: hit.releaseDate?.slice(0, 4) });
    }
    if (!audience.length) { appendFileSync(out, JSON.stringify({ id: c.id, error: "no audience", picks }) + "\n"); continue; }
    try {
      const a = await analyzeAudience({ id: c.id, label: c.id, pitch: "", mode: "example", audience, window: DEFAULT_WINDOW }, undefined, false);
      // Sequels of a named game ("named") have no number but rank first: they share the players by definition.
      const w = (r: (typeof a.releases)[number]) => (r.via === "named" ? 1 : r.affinity ?? -1);
      const ranked = a.releases.filter((r) => r.kind === "game" && (r.affinity !== null || r.via === "named")).sort((x, y) => w(y) - w(x));
      const games = ranked.filter((r) => r.affinity !== null);
      const films = a.releases.filter((r) => r.kind === "movie" && r.affinity !== null);
      const top = ranked.slice(0, 3).map((r) => `${r.title} ${r.via === "named" ? "(named)" : r.affinity!.toFixed(2)}`);
      const rankOf = (sub: string) => ranked.findIndex((r) => r.title.includes(sub)) + 1;
      const expectRanks = c.expect.map((e) => ({ e, rank: rankOf(e) }));
      const row = {
        id: c.id, picks, audienceScored: games.length,
        gta: a.verdict.gta.answer, gtaAff: a.verdict.gta.affinity, gtaRank: a.verdict.gta.rank,
        top, expect: expectRanks,
        bestExpectRank: expectRanks.length ? Math.min(...expectRanks.map((x) => x.rank || 99)) : null,
        spread: games.length ? +(games[0].affinity! - games[games.length - 1].affinity!).toFixed(2) : null,
        gameMin: games.length ? games[games.length - 1].affinity : null, gameMax: games.length ? games[0].affinity : null,
        filmRange: films.length ? [Math.min(...films.map((f) => f.affinity!)), Math.max(...films.map((f) => f.affinity!))] : null,
        levels: a.weeks.map((w) => ({ clash: "R", overlap: "Y", clear: "G", open: "-" })[w.level]).join(""),
        gtaVia: a.releases.find((r) => r.key === "gta6")?.via,
        unscoredGames: a.releases.filter((r) => r.kind === "game" && r.affinity === null).map((r) => r.title),
        recommended: a.verdict.recommended.map((p) => p.weekStart), avoid: a.verdict.avoid.map((p) => p.weekStart),
        seconds: Math.round((Date.now() - t0) / 100) / 10,
      };
      appendFileSync(out, JSON.stringify(row) + "\n");
      console.log(`${c.id.padEnd(18)} GTA ${row.gta.padEnd(5)} ${row.gtaAff?.toFixed(2)} | top: ${top.join(" ; ")} | expect ${JSON.stringify(expectRanks)}`);
    } catch (e) {
      appendFileSync(out, JSON.stringify({ id: c.id, error: (e as Error).message, picks }) + "\n");
      console.log(`${c.id} ERROR ${(e as Error).message}`);
    }
  }
  console.log("New Qloo calls:", callCount() - before, "| total:", callCount());
})();

// Probe: multi-signal behaviour and filter.entities capacity. Run: npx tsx scripts/probe-multi.ts
import "./load-env";
import { readFileSync, writeFileSync } from "node:fs";
import { overlap, VIDEOGAME, MOVIE } from "../lib/qloo-ops";
import { callCount } from "../lib/qloo";

const input = JSON.parse(readFileSync("data/probe/multi-input.json", "utf8"));
const games: string[] = input.games;
const films = [
  "5FA52F15-70F2-4E2C-8EA1-94D271F78AB4", "7EF70140-4061-4893-8917-E17D949E6535", "991136D8-3027-4A42-8340-B2DF0BEBACAB",
  "E54266F3-B5ED-453C-AAB8-59BF6826B7E4", "1532FCBC-399E-4220-AC86-655487758DF9", "A3498F6E-DB49-44C3-90AA-D50765105014",
  "20DEDEF4-A5AF-405D-8C4C-DEE2082B1777", "36324AA9-546D-4E43-B4E9-409C0E96147E", "20AF72F1-9794-4C41-B669-BF258603E820",
  "09D4573C-07F3-4701-897C-CC9B0739C8A1", "572EDC53-D35D-4E0B-B987-A9B0CA0B5AFD", "5BA6BEDB-F8E6-4D01-B4CB-C9ED35D4DFD9",
  "7498446C-D18D-4A2B-92F6-9C77E5F174F9", "E91D7A66-6147-4228-A659-1639AEF39614",
];
const STARDEW = "875DB771-9C4C-4DD0-9249-D2ABD95711F1";
const ACNH = "08663BD2-E267-4C7F-9895-86410F67867C";
const RDR2 = "0ED6691B-1F06-46D7-8F17-DB18826A5D0F";
const RDR1 = "91C2266A-3118-4241-A709-D4621244D965";
const HK = "F4370AF5-3171-48C7-95DB-38ED25B1F80C";
const ORI = "A8B49246-75B2-468A-AAA1-3DCDCE260CE7";
const DC = "870FBF81-80F8-401A-9621-63DBF6AB6C07";

const tests = [
  { name: "stardew-alone games", signal: [STARDEW], targets: games, type: VIDEOGAME },
  { name: "stardew+acnh games", signal: [STARDEW, ACNH], targets: games, type: VIDEOGAME },
  { name: "rdr2-alone games", signal: [RDR2], targets: games, type: VIDEOGAME },
  { name: "rdr2+rdr1 games", signal: [RDR2, RDR1], targets: games, type: VIDEOGAME },
  { name: "hk+ori+dc games", signal: [HK, ORI, DC], targets: games, type: VIDEOGAME },
  { name: "stardew+acnh films", signal: [STARDEW, ACNH], targets: films, type: MOVIE },
  { name: "rdr2+rdr1 films", signal: [RDR2, RDR1], targets: films, type: MOVIE },
  { name: "hk+ori+dc films", signal: [HK, ORI, DC], targets: films, type: MOVIE },
];

(async () => {
  const out: Record<string, unknown> = {};
  for (const t of tests) {
    try {
      const { scores, record } = await overlap(t.signal, t.targets, t.type as any);
      console.log("##", t.name, "| targets", t.targets.length, "-> scored", scores.length, "| HTTP", record.status, "| cached", record.cached);
      for (const s of scores) console.log("   ", s.affinity.toFixed(3), s.name);
      out[t.name] = scores;
    } catch (e) {
      console.log("##", t.name, "ERROR", (e as Error).message);
    }
  }
  writeFileSync("data/probe/multi-output.json", JSON.stringify(out, null, 1));
  console.log("Qloo calls so far:", callCount());
})();

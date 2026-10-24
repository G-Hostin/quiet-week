// Probe which stand-in entities Qloo can score. Run: npx tsx scripts/probe-proxies.ts
import "./load-env";
import { overlap, search, VIDEOGAME, MOVIE } from "../lib/qloo-ops";
import { callCount } from "../lib/qloo";

const SIGNALS: Record<string, string[]> = {
  farm: ["875DB771-9C4C-4DD0-9249-D2ABD95711F1", "08663BD2-E267-4C7F-9895-86410F67867C"],
  western: ["0ED6691B-1F06-46D7-8F17-DB18826A5D0F", "91C2266A-3118-4241-A709-D4621244D965"],
  metroid: ["F4370AF5-3171-48C7-95DB-38ED25B1F80C", "A8B49246-75B2-468A-AAA1-3DCDCE260CE7", "870FBF81-80F8-401A-9621-63DBF6AB6C07"],
};
const GAME_PROXIES = [
  "13F16103-93F8-43EA-ABFD-D1B772C634A7", "24BA864F-5394-4E98-9762-CEA9B736AD4B", "DB84F0D6-EF20-4779-9F9E-B5D1B02116B7",
  "CD994813-8FCF-45C8-9EA7-0BF6FC379107", "7296523F-E203-4F2E-AF93-C7AA35BFA09D", "FE259261-4C0F-4948-8F19-6C4645F696C8",
  "E81A8E1A-DA1A-4AB6-B0FC-120C56F5E890", "C13DDCEF-619C-4856-B369-63208812BA60", "59F2CAF2-C190-4E4E-A2F5-F71C2D52D4C9",
  "18771726-F81F-4D27-8280-CFFB633FC596", "1207B05A-10FE-4B65-987A-604D5F1ED359", "F83FFF69-93DC-47CD-9885-FF4934B4A2BA",
  "A709FF67-210A-43FF-8039-6A0210056266", "ED09419D-2979-4EE9-8691-A4D9CFDEC547", "94C61557-E11A-4DE7-A197-05E9F3830AF7",
  "2FEC4863-3DD8-44EB-8EB9-0337316017B7", "75713A82-F511-48F5-81C3-3EFC8251D06E",
];
const MOVIE_PROXIES = [
  "0063BFEC-EB8C-458D-A0BF-D7028F5294F6", "EF270065-6364-4867-8D0F-6BE4A3CA6538", "A3A2DD32-AE95-40B9-BDF4-4F654EB46694",
  "3A829C06-0C14-456B-8596-A08152406C35", "5DEAED2B-6A08-43F9-9967-6FD615E35EBF", "878A5D45-469C-4556-8494-963C2B1D3A95",
  "B9EC7F73-6199-4978-8422-88BD7CD9B1E2", "E595B4DD-CDE1-4FD1-B4DD-A67A5293493C", "66F337B9-58EC-4643-B525-BCD68B2440F5",
  "D97D14FB-4CD2-4B69-B3B9-F5BBD2AD76BE", "7EF70140-4061-4893-8917-E17D949E6535",
];

(async () => {
  for (const q of ["Graveyard Keeper", "Hades", "Celeste"]) {
    const { hits } = await search(q, VIDEOGAME, 3);
    console.log("# search", q, hits.map((h) => `${h.name} ${h.id} ${h.releaseDate}`).join(" || "));
  }
  for (const [name, sig] of Object.entries(SIGNALS)) {
    const g = await overlap(sig, GAME_PROXIES, VIDEOGAME);
    console.log(`## ${name} games: ${g.scores.length}/${GAME_PROXIES.length} scored`);
    for (const s of g.scores) console.log("   ", s.affinity.toFixed(3), s.name);
    const m = await overlap(sig, MOVIE_PROXIES, MOVIE);
    console.log(`## ${name} movies: ${m.scores.length}/${MOVIE_PROXIES.length} scored`);
    for (const s of m.scores) console.log("   ", s.affinity.toFixed(3), s.name);
  }
  console.log("Qloo calls so far:", callCount());
})();

// Probe: is there a cap on scored results per call? Run: npx tsx scripts/probe-cap.ts
import "./load-env";
import { qlooGet, entitiesOf, callCount } from "../lib/qloo";

const FARM = "875DB771-9C4C-4DD0-9249-D2ABD95711F1,08663BD2-E267-4C7F-9895-86410F67867C";
const MISSING = [
  "61984077-C126-4A1D-96D2-0CF1D87703BB", "B04B8FB3-1E41-4533-BCBA-DDDE64830F18", "DBB0785A-A0A4-4BF7-BB7D-DA814B67FA9C",
  "1ECB50A0-BF6A-43D1-A190-026886BFB364", "7B9AA8B3-510E-43E4-BA5B-567AA4A75C24", "96F4FBF7-6C08-436A-9C97-155FF6344994",
  "2FEC4863-3DD8-44EB-8EB9-0337316017B7", "3B397EFF-7FFB-4763-A13D-E343196DF03E", "40C45656-B28F-4181-813D-90BA600BB33D",
  "F1D8F949-1D43-4B5E-A71A-FE622353FB54",
];
(async () => {
  for (const take of ["10", "50"]) {
    const { body } = await qlooGet("/v2/insights", {
      "filter.type": "urn:entity:videogame",
      "signal.interests.entities": FARM,
      "filter.entities": MISSING.join(","),
      take,
    });
    const es = entitiesOf(body);
    console.log("## take", take, "->", es.length, "scored; warnings:", JSON.stringify(body.warnings || null).slice(0, 300));
    for (const e of es) console.log("   ", (e.query?.affinity ?? 0).toFixed(3), e.name);
  }
  console.log("Qloo calls so far:", callCount());
})();

// Probe: does filter.results.entities behave like the deprecated filter.entities? Run: npx tsx scripts/probe-param.ts
import "./load-env";
import { qlooGet, entitiesOf, callCount } from "../lib/qloo";

const RDR2 = "0ED6691B-1F06-46D7-8F17-DB18826A5D0F";
const TARGETS = "FEFD4E0D-D8F2-4BF9-86C9-06949DE82BCD,3B397EFF-7FFB-4763-A13D-E343196DF03E,875DB771-9C4C-4DD0-9249-D2ABD95711F1";
(async () => {
  const { body } = await qlooGet("/v2/insights", {
    "filter.type": "urn:entity:videogame",
    "signal.interests.entities": RDR2,
    "filter.results.entities": TARGETS,
    take: "3",
  });
  const es = entitiesOf(body);
  console.log("scored", es.length, "warnings", JSON.stringify(body.warnings || null));
  for (const e of es) console.log("   ", (e.query?.affinity ?? 0).toFixed(3), e.name);
  console.log("Qloo calls so far:", callCount());
})();

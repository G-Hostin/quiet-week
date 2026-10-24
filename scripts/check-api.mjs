// Drive the running local server's API like the browser does (NDJSON streams).
// Run: node scripts/check-api.mjs "Stardew Valley" "Spiritfarer" "A Short Hike"
const base = "http://localhost:3410";
const titles = process.argv.slice(2);

async function stream(path, body, onStep) {
  const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}: ${await res.text()}`);
  const text = await res.text();
  let result = null;
  for (const line of text.split("\n").filter(Boolean)) {
    const ev = JSON.parse(line);
    if (ev.type === "step") onStep(ev.step);
    if (ev.type === "error") throw new Error(ev.message);
    if (ev.type === "result") result = ev.data;
  }
  return result;
}

const t0 = Date.now();
const log = (s) => console.log(`  [${(s.ms / 1000).toFixed(1)}s] ${s.kind.padEnd(7)} ${s.text}`);
const r = await stream("/api/resolve", { titles }, log);
console.log("matches:", r.matches.map((m) => `${m.typed} -> ${m.candidates.find((c) => c.id === m.pickedId)?.name ?? "none"} (data: ${m.audienceData}) | ${m.note}`));
const audience = r.matches
  .map((m) => m.candidates.find((c) => c.id === m.pickedId))
  .filter(Boolean)
  .map((h) => ({ id: h.id, name: h.name, image: h.image, year: h.releaseDate?.slice(0, 4) }));
const a = await stream("/api/analyze", { audience, window: { start: "2026-11-01", end: "2027-03-31" }, pitch: "test", label: "API check" }, log);
console.log(`GTA ${a.verdict.gta.answer} ${a.verdict.gta.affinity}; best ${a.verdict.recommended.map((p) => p.weekStart)}; summary by ${a.verdict.summaryBy}`);
console.log(a.verdict.summary);
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// Probe Gemini function calling (prints only model text / call names, never the key).
import "./load-env";

const key = process.env.GEMINI_API_KEY!;
const model = process.argv[2] || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const tools = [
  {
    functionDeclarations: [
      {
        name: "search_qloo",
        description: "Search Qloo for a video game by title.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      },
    ],
  },
];

async function call(contents: any[]) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents, tools, generationConfig: { temperature: 0.2 } }),
  });
  const j: any = await r.json();
  return { status: r.status, j };
}

(async () => {
  const contents: any[] = [{ role: "user", parts: [{ text: "Find the Qloo entity for the game Stardew Valley. Use the tool." }] }];
  const t0 = Date.now();
  const a = await call(contents);
  console.log("HTTP", a.status, "ms", Date.now() - t0);
  if (a.status !== 200) {
    console.log(JSON.stringify(a.j).slice(0, 400));
    return;
  }
  const content = a.j.candidates?.[0]?.content;
  console.log("parts:", JSON.stringify(content?.parts?.map((p: any) => Object.keys(p))));
  const fc = content?.parts?.find((p: any) => p.functionCall)?.functionCall;
  console.log("functionCall:", JSON.stringify(fc));
  if (!fc) return;
  contents.push(content);
  contents.push({
    role: "user",
    parts: [{ functionResponse: { name: fc.name, response: { results: [{ id: "875DB771", name: "Stardew Valley", year: 2016 }] } } }],
  });
  const b = await call(contents);
  console.log("HTTP2", b.status, JSON.stringify(b.j.candidates?.[0]?.content?.parts?.map((p: any) => p.text || Object.keys(p))).slice(0, 400));
  console.log("usage", JSON.stringify(b.j.usageMetadata));
})();

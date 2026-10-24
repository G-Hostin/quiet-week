// POST /api/resolve  { titles: string[] }  -> NDJSON stream of agent steps, then the matches.
import { resolveTitles } from "@/lib/agent/resolve-agent";
import { ndjsonResponse } from "@/lib/stream";
import { cleanTitles, jsonError, rateLimited } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (rateLimited(req, 20)) return jsonError("Too many requests. Try again in a few minutes.", 429);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Send JSON with a titles array.", 400);
  }
  const titles = cleanTitles(body?.titles);
  if (!titles) return jsonError("Give 1 to 3 game titles.", 400);
  return ndjsonResponse(async (send) => {
    const r = await resolveTitles(titles, (step) => send({ type: "step", step }));
    send({ type: "result", data: { matches: r.matches, by: r.by, geminiCalls: r.geminiCalls, qlooCalls: r.calls.length } });
  });
}

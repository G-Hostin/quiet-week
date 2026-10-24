// POST /api/analyze  { audience, window, pitch, label } -> NDJSON stream of agent steps, then the Analysis.
import { analyzeAudience } from "@/lib/agent/analyze-agent";
import { ndjsonResponse } from "@/lib/stream";
import { cleanAudience, cleanPitch, cleanWindow, jsonError, rateLimited } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (rateLimited(req, 10)) return jsonError("Too many requests. Try again in a few minutes.", 429);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Send JSON with an audience array.", 400);
  }
  const audience = cleanAudience(body?.audience);
  if (!audience) return jsonError("Confirm 1 to 3 games first.", 400);
  const window = cleanWindow(body?.window);
  const pitch = cleanPitch(body?.pitch);
  const label = cleanPitch(body?.label).slice(0, 60) || "Your game";
  return ndjsonResponse(async (send) => {
    const a = await analyzeAudience(
      { id: `live-${Date.now().toString(36)}`, label, pitch, mode: "live", audience, window },
      (step) => send({ type: "step", step }),
    );
    send({ type: "result", data: a });
  });
}

// NDJSON streaming helpers shared by the API routes (server) and the UI (client).

export type StreamEvent =
  | { type: "step"; step: import("./types").Step }
  | { type: "result"; data: unknown }
  | { type: "error"; message: string };

/** Server: build a streaming Response that runs `work` and pushes events as NDJSON lines. */
export function ndjsonResponse(work: (send: (e: StreamEvent) => void) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
      try {
        await work(send);
      } catch (e) {
        send({ type: "error", message: (e as Error).message || "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

/** Client: POST JSON and read NDJSON events as they arrive. */
export async function postStream(url: string, body: unknown, onEvent: (e: StreamEvent) => void): Promise<void> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok || !res.body) {
    let msg = `Request failed (HTTP ${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf));
}

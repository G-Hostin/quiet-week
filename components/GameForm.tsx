"use client";

import { useState } from "react";
import { postStream } from "@/lib/stream";
import type { Analysis, AudienceGame, Step } from "@/lib/types";
import type { SearchHit } from "@/lib/qloo-ops";
import { StepList } from "./AgentLog";
import MatchPicker, { type Match } from "./MatchPicker";

type Phase = "input" | "resolving" | "confirm" | "analyzing";

const MONTHS = [
  ["2026-11", "Nov 2026"], ["2026-12", "Dec 2026"], ["2027-01", "Jan 2027"], ["2027-02", "Feb 2027"], ["2027-03", "Mar 2027"],
];
const LAST: Record<string, string> = { "2026-11": "30", "2026-12": "31", "2027-01": "31", "2027-02": "28", "2027-03": "31" };

export default function GameForm({ onDone, onCancel }: { onDone: (a: Analysis) => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<Phase>("input");
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [titles, setTitles] = useState(["", "", ""]);
  const [from, setFrom] = useState("2026-11");
  const [to, setTo] = useState("2027-03");
  const [steps, setSteps] = useState<Step[]>([]);
  const [measureSteps, setMeasureSteps] = useState<Step[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [picked, setPicked] = useState<Record<number, string | null>>({});
  const [error, setError] = useState<string | null>(null);

  const typed = titles.map((t) => t.trim()).filter(Boolean);

  async function resolve(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.length) return setError("Type at least one well-known game whose players look like yours.");
    if (to < from) return setError("The end of the window must come after its start.");
    setError(null);
    setSteps([]);
    setPhase("resolving");
    try {
      await postStream("/api/resolve", { titles: typed }, (ev) => {
        if (ev.type === "step") setSteps((s) => [...s, ev.step]);
        if (ev.type === "error") throw new Error(ev.message);
        if (ev.type === "result") {
          const ms = (ev.data as { matches: Match[] }).matches;
          setMatches(ms);
          setPicked(Object.fromEntries(ms.map((m, i) => [i, m.pickedId])));
          setPhase("confirm");
        }
      });
    } catch (err) {
      setError((err as Error).message);
      setPhase("input");
    }
  }

  async function analyze() {
    const audience: AudienceGame[] = [];
    matches.forEach((m, i) => {
      const id = picked[i];
      const h = m.candidates.find((c: SearchHit) => c.id === id);
      if (h && !audience.some((a) => a.id === h.id)) audience.push({ id: h.id, name: h.name, image: h.image, year: h.releaseDate?.slice(0, 4) });
    });
    if (!audience.length) return setError("Confirm at least one game, or search again with another title.");
    setError(null);
    setMeasureSteps([]);
    setPhase("analyzing");
    try {
      await postStream(
        "/api/analyze",
        { audience, window: { start: `${from}-01`, end: `${to}-${LAST[to]}` }, pitch, label: name || "Your game" },
        (ev) => {
          if (ev.type === "step") setMeasureSteps((s) => [...s, ev.step]);
          if (ev.type === "error") throw new Error(ev.message);
          if (ev.type === "result") onDone(ev.data as Analysis);
        },
      );
    } catch (err) {
      setError((err as Error).message);
      setPhase("confirm");
    }
  }

  const busy = phase === "resolving" || phase === "analyzing";
  return (
    <section className="section" id="try" aria-labelledby="try-title">
      <div className="wrap">
        <div className="tryform card">
          <div className="tryform-head">
            <h2 id="try-title">Test your game</h2>
            <button type="button" className="btn btn-ghost btn-small" onClick={onCancel} disabled={busy}>Close</button>
          </div>
          {(phase === "input" || phase === "resolving") && (
            <form onSubmit={resolve} className="fields">
              <label className="field">
                <span>Game name <span className="muted">(optional)</span></span>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Lantern Keeper" disabled={busy} />
              </label>
              <label className="field field-wide">
                <span>One sentence about it <span className="muted">(stays in your browser and on our server; never sent to the AI model)</span></span>
                <input value={pitch} onChange={(e) => setPitch(e.target.value)} maxLength={240} placeholder="A cozy lighthouse sim about keeping a coastal village safe." disabled={busy} />
              </label>
              <fieldset className="field field-wide">
                <legend>1 to 3 well-known games whose players look like yours</legend>
                <div className="titles">
                  {titles.map((t, i) => (
                    <input key={i} value={t} aria-label={`Comparable game ${i + 1}`} maxLength={80} disabled={busy}
                      placeholder={["Stardew Valley", "Spiritfarer", "A Short Hike"][i]}
                      onChange={(e) => setTitles((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <span>Launch window</span>
                <div className="window">
                  <select aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} disabled={busy}>
                    {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <span className="muted">to</span>
                  <select aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} disabled={busy}>
                    {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="actions">
                <button className="btn" type="submit" disabled={busy}>{busy ? "Finding your games…" : "Find these games in Qloo"}</button>
              </div>
            </form>
          )}
          {phase === "confirm" && (
            <MatchPicker matches={matches} picked={picked} onPick={(i, id) => setPicked((p) => ({ ...p, [i]: id }))}
              onBack={() => { setPhase("input"); setSteps([]); }} onGo={analyze} />
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {steps.length > 0 && (
            <div className="agent-live">
              <p className="small muted">{busy ? "The agent is working. Each line is a real tool call." : "Agent journal"}</p>
              <p className="agent-phase">Finding your games</p>
              <StepList steps={steps} live={phase === "resolving"} />
              {measureSteps.length > 0 && (
                <>
                  <p className="agent-phase">Measuring against the calendar</p>
                  <StepList steps={measureSteps} live={phase === "analyzing"} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

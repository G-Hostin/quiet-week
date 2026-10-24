"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lastDayOfMonth } from "@/lib/dates";
import { EXAMPLE_ANALYSES } from "@/lib/examples";
import { friendlyError, viewFrom, type View } from "@/lib/present";
import type { SearchHit } from "@/lib/qloo-ops";
import { postStream } from "@/lib/stream";
import type { Analysis, AudienceGame, Step, SteamEvent } from "@/lib/types";
import ExampleCards from "../ExampleCards";
import Stepper from "./Stepper";
import StepGame, { type FormState } from "./StepGame";
import StepConfirm, { type Match } from "./StepConfirm";
import AgentWorking from "./AgentWorking";
import ResultView from "./ResultView";

type Phase = "game" | "resolving" | "confirm" | "analyzing";

const STORE = "quiet-week:last-result";
const IDS = EXAMPLE_ANALYSES.map((e) => e.id);

function urlFor(v: View): string {
  if (v.kind === "example") return `/check?example=${v.id}`;
  if (v.kind === "mine") return "/check?result=mine";
  return "/check";
}

function readStored(): Analysis | null {
  try {
    const raw = sessionStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Analysis) : null;
  } catch {
    return null;
  }
}

export default function CheckApp(props: { initial: View; steamEvents: SteamEvent[]; calendarUpdated: string }) {
  const [view, setView] = useState<View>(props.initial);
  const [phase, setPhase] = useState<Phase>("game");
  const [form, setForm] = useState<FormState>({ name: "", pitch: "", titles: ["", "", ""], from: "2026-11", to: "2027-03" });
  const [resolveSteps, setResolveSteps] = useState<Step[]>([]);
  const [measureSteps, setMeasureSteps] = useState<Step[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [picked, setPicked] = useState<Record<number, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Analysis | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [lostResult, setLostResult] = useState(false);
  const first = useRef(true);

  // Browser back/forward between the steps and the result.
  useEffect(() => {
    setLive(readStored());
    setHydrated(true);
    const onPop = () => setView(viewFrom(new URLSearchParams(window.location.search), IDS));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const go = useCallback((v: View) => {
    setView(v);
    const url = urlFor(v);
    if (window.location.pathname + window.location.search !== url) window.history.pushState(null, "", url);
  }, []);

  const example = view.kind === "example" ? EXAMPLE_ANALYSES.find((e) => e.id === view.id) ?? null : null;
  const mineMissing = view.kind === "mine" && hydrated && !live;
  const result = example ?? (view.kind === "mine" ? live : null);
  const screen = result ? `result:${result.id}` : view.kind === "mine" && !hydrated ? "loading" : `tool:${phase}`;

  useEffect(() => {
    if (mineMissing) {
      setLostResult(true);
      go({ kind: "tool" });
    }
  }, [mineMissing, go]);

  // New screen: back to the top, focus its heading (not on first load), and name the tab.
  useEffect(() => {
    const heading = document.getElementById(result ? "answer-title" : "step-title");
    if (first.current) first.current = false;
    else {
      window.scrollTo({ top: 0, behavior: "instant" });
      heading?.focus({ preventScroll: true });
    }
    const name = result ? `${result.mode === "example" ? "Example: " : ""}${result.label}` : "Check your launch window";
    document.title = `${name} · Quiet Week`;
  }, [screen, result]);

  async function resolve() {
    const typed = form.titles.map((t) => t.trim()).filter(Boolean);
    if (!typed.length) return setError("Type at least one well-known game whose players look like yours.");
    if (form.to < form.from) return setError("The end of your launch window must come after its start.");
    setError(null);
    setLostResult(false);
    setResolveSteps([]);
    setPhase("resolving");
    try {
      await postStream("/api/resolve", { titles: typed }, (ev) => {
        if (ev.type === "step") setResolveSteps((s) => [...s, ev.step]);
        if (ev.type === "error") throw new Error(ev.message);
        if (ev.type === "result") {
          const ms = (ev.data as { matches: Match[] }).matches;
          setMatches(ms);
          setPicked(Object.fromEntries(ms.map((m, i) => [i, m.pickedId])));
          setPhase("confirm");
        }
      });
    } catch (err) {
      setError(friendlyError((err as Error).message, "resolve"));
      setPhase("game");
    }
  }

  async function analyze() {
    const audience: AudienceGame[] = [];
    matches.forEach((m, i) => {
      const id = picked[i];
      const h = m.candidates.find((c: SearchHit) => c.id === id);
      if (h && !audience.some((x) => x.id === h.id)) audience.push({ id: h.id, name: h.name, image: h.image, year: h.releaseDate?.slice(0, 4) });
    });
    if (!audience.length) return setError("Confirm at least one game, or go back and try another title.");
    setError(null);
    setMeasureSteps([]);
    setPhase("analyzing");
    try {
      await postStream(
        "/api/analyze",
        { audience, window: { start: `${form.from}-01`, end: lastDayOfMonth(form.to) }, pitch: form.pitch, label: form.name || "Your game" },
        (ev) => {
          if (ev.type === "step") setMeasureSteps((s) => [...s, ev.step]);
          if (ev.type === "error") throw new Error(ev.message);
          if (ev.type === "result") {
            const a = ev.data as Analysis;
            setLive(a);
            try {
              sessionStorage.setItem(STORE, JSON.stringify(a));
            } catch {
              /* storage full or disabled: the result still shows */
            }
            setPhase("confirm");
            go({ kind: "mine" });
          }
        },
      );
    } catch (err) {
      setError(friendlyError((err as Error).message, "analyze"));
      setPhase("confirm");
    }
  }

  const openExample = (id: string) => go({ kind: "example", id });
  const checkOwn = () => {
    setPhase((p) => (p === "confirm" && matches.length ? "confirm" : "game"));
    go({ kind: "tool" });
  };
  const edit = () => {
    setPhase("game");
    go({ kind: "tool" });
  };

  if (result) {
    return (
      <main id="main">
        <ResultView
          key={`${result.id}:${result.createdAt}`}
          analysis={result}
          examples={EXAMPLE_ANALYSES}
          steamEvents={props.steamEvents}
          calendarUpdated={props.calendarUpdated}
          onCheckOwn={checkOwn}
          onEdit={edit}
          onExample={openExample}
        />
      </main>
    );
  }

  if (view.kind === "mine" && !hydrated) {
    return (
      <main id="main" className="wrap tool">
        <p className="muted">Loading your result…</p>
      </main>
    );
  }

  const stepIndex = phase === "game" || phase === "resolving" ? 0 : phase === "confirm" ? 1 : 2;
  return (
    <main id="main" className="tool band-work">
      <div className="wrap">
        <div className="tool-head">
          <h1>Check your launch window</h1>
          <Stepper current={stepIndex} />
        </div>
        <div className={`tool-grid ${phase === "game" ? "has-aside" : ""}`}>
          <div className="tool-main">
            {lostResult && phase === "game" && (
              <p className="notice tool-notice">Your last result is no longer in this tab. Run the check again: it takes under a minute.</p>
            )}
            {phase === "game" && <StepGame form={form} onChange={setForm} onSubmit={resolve} error={error} />}
            {phase === "resolving" && <AgentWorking kind="resolve" steps={resolveSteps} />}
            {phase === "confirm" && (
              <StepConfirm
                matches={matches}
                picked={picked}
                steps={resolveSteps}
                error={error}
                onPick={(i, id) => setPicked((p) => ({ ...p, [i]: id }))}
                onBack={() => {
                  setError(null);
                  setPhase("game");
                }}
                onGo={analyze}
              />
            )}
            {phase === "analyzing" && <AgentWorking kind="analyze" steps={measureSteps} />}
          </div>
          {phase === "game" && (
            <aside className="tool-aside" aria-labelledby="try-title">
              <h2 id="try-title">No game yet? Try an example</h2>
              <p className="small muted">Ready-made checks that open instantly, with real Qloo numbers.</p>
              <ExampleCards examples={EXAMPLE_ANALYSES} onOpen={openExample} compact />
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}

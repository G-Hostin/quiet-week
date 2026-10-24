"use client";

import { useRef, useState } from "react";
import { shortDate } from "@/lib/dates";
import { aff, hostOf, kindLabel, measuredAs, scoreText } from "@/lib/format";
import { weightOf } from "@/lib/calendar";
import type { Analysis, SteamEvent } from "@/lib/types";
import StepList from "../StepList";
import { ChevronDown } from "../Icons";

const KIND: Record<string, string> = { "urn:entity:videogame": "games", "urn:entity:movie": "films" };
const TABS = [
  { id: "releases", label: "Releases" },
  { id: "calls", label: "Qloo calls" },
  { id: "agent", label: "Agent steps" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Releases({ a, steamEvents, onCall }: { a: Analysis; steamEvents: SteamEvent[]; onCall: (i: number) => void }) {
  const rows = [...a.releases].sort((x, y) => (weightOf(y) ?? -1) - (weightOf(x) ?? -1));
  return (
    <>
      <p className="src-intro">
        All {rows.length} releases in your window, closest to your players first. Every score links to the Qloo call
        that returned it, every date to its public source.
      </p>
      <div className="table-wrap">
        <table className="src-table">
          <thead>
            <tr>
              <th scope="col">Release</th>
              <th scope="col">Out</th>
              <th scope="col" className="r">Overlap</th>
              <th scope="col">Measured</th>
              <th scope="col">Qloo call</th>
              <th scope="col">Date source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={`lvl-${r.level}`}>
                <th scope="row" data-l="Release">
                  <span className="dot" aria-hidden="true" /> {r.title} <span className="muted">{kindLabel(r.kind)}</span>
                </th>
                <td className="num nowrap" data-l="Out">{shortDate(r.date)}</td>
                <td className="num r strong" data-l="Overlap">{scoreText(r)}</td>
                <td data-l="Measured">{measuredAs(r)}</td>
                <td className="num" data-l="Qloo call">
                  {r.callIndex !== undefined ? (
                    <button type="button" className="linkish" onClick={() => onCall(r.callIndex!)}>
                      Call {r.callIndex + 1}
                    </button>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </td>
                <td data-l="Date source">
                  <a href={r.source.url} target="_blank" rel="noopener noreferrer">
                    {r.source.publisher}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>{" "}
                  <span className="muted">{hostOf(r.source.url)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">
        Steam events: {steamEvents.map((e) => `${e.title}, ${shortDate(e.start)} to ${shortDate(e.end)}`).join("; ")}. Source:{" "}
        <a href={steamEvents[0]?.source.url} target="_blank" rel="noopener noreferrer">
          Valve, Steamworks documentation
        </a>
        .
      </p>
    </>
  );
}

function Calls({ a }: { a: Analysis }) {
  const names = a.evidence.names;
  const audience = new Map(a.audience.map((g) => [g.id, g.name]));
  return (
    <>
      <p className="src-intro">
        Each call sends your games as the signal and a list of releases (or the earlier games standing in for them) to
        score. Qloo returns a 0 to 1 overlap for each one it can score and leaves the rest out. Endpoint:{" "}
        <code>GET https://hackathon.api.qloo.com/v2/insights</code>. The API key stays on the server.
      </p>
      <ol className="calls">
        {a.evidence.calls.map((c, i) => {
          const sig = (c.params["signal.interests.entities"] || "").split(",").filter(Boolean);
          const tgt = (c.params["filter.results.entities"] || c.params["filter.entities"] || "").split(",").filter(Boolean);
          return (
            <li key={i} id={`call-${i + 1}`} className="call" tabIndex={-1}>
              <p className="call-head">
                <strong>Call {i + 1}</strong>: scores {tgt.length} {KIND[c.params["filter.type"]] || "entities"}, {c.resultCount} came back with a score{" "}
                <span className="muted small">(HTTP {c.status}, {c.cached ? "served from cache" : `${c.ms} ms`})</span>
              </p>
              <dl className="call-params small">
                <dt>filter.type</dt>
                <dd><code>{c.params["filter.type"]}</code></dd>
                <dt>signal.interests.entities</dt>
                <dd>
                  {sig.map((id) => (
                    <span key={id} className="idchip"><code>{id.slice(0, 8)}</code> {audience.get(id) || ""}</span>
                  ))}
                </dd>
                <dt>filter.results.entities</dt>
                <dd>
                  {tgt.map((id) => (
                    <span key={id} className={`idchip ${names[id] ? "" : "is-missing"}`}>
                      <code>{id.slice(0, 8)}</code> {names[id] || "no score"}
                    </span>
                  ))}
                </dd>
                <dt>take</dt>
                <dd><code>{c.params.take}</code></dd>
              </dl>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Agent({ a }: { a: Analysis }) {
  const st = a.stats;
  return (
    <>
      <div className="agent-say">
        <p className="agent-say-l">The agent&apos;s written verdict</p>
        <blockquote>{a.verdict.summary}</blockquote>
        <p className="small muted">
          {a.verdict.summaryBy === "agent"
            ? "Written by the Gemini agent from the Qloo numbers. A check rejects any number, date or sales claim the tools did not return."
            : "Assembled from the Qloo numbers (the agent's text was not available)."}
        </p>
      </div>
      <p className="src-intro">
        {a.mode === "example" ? "Recorded when this example was precomputed. " : ""}
        {st.geminiCalls ? `Gemini (${st.model}) called the tools ${st.geminiCalls} times. ` : "The fixed pipeline ran the tools without the language model. "}
        The model only ever saw game and film titles, dates and Qloo numbers. The colours and the week picks are
        computed by plain, tested code, not by the model.
      </p>
      <StepList steps={a.steps} />
    </>
  );
}

/** Sources & method: collapsed by default, with the key facts visible and three tabs for the full record. */
export default function Sources({ analysis, steamEvents }: { analysis: Analysis; steamEvents: SteamEvent[] }) {
  const a = analysis;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("releases");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const standIns = a.releases.filter((r) => r.via === "stand-in").length;
  const unscored = a.releases.filter((r) => r.affinity === null && r.via !== "named").length;
  const calls = a.evidence.calls.length;

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let j = i;
    if (e.key === "ArrowRight") j = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[j].id);
    tabRefs.current[j]?.focus();
  }

  function showCall(i: number) {
    setTab("calls");
    requestAnimationFrame(() => {
      const el = document.getElementById(`call-${i + 1}`);
      el?.scrollIntoView({ block: "start" });
      el?.focus();
    });
  }

  return (
    <section className="res-sec" id="sources" aria-labelledby="sources-title">
      <div className="sec-head">
        <h2 id="sources-title">Sources &amp; method</h2>
        <p>Every number on this page comes from a Qloo call, and every date from a public source.</p>
      </div>
      <div className="src">
        <dl className="src-facts">
          <div><dt>Qloo calls</dt><dd className="num">{calls}</dd></div>
          <div><dt>Releases scored</dt><dd className="num">{a.releases.length - unscored} of {a.releases.length}</dd></div>
          <div><dt>Measured through an earlier game or film</dt><dd className="num">{standIns}</dd></div>
          <div><dt>Agent steps</dt><dd className="num">{a.steps.length}</dd></div>
        </dl>
        <button type="button" className="src-toggle" aria-expanded={open} aria-controls="src-body" onClick={() => setOpen((o) => !o)}>
          <span>{open ? "Hide the full record" : "Show every release, Qloo call and agent step"}</span>
          <ChevronDown size={16} className="src-chev" />
        </button>
        <div id="src-body" className="src-body" hidden={!open}>
          <div className="tabs" role="tablist" aria-label="Sources and method">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className="tab"
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {TABS.map((t) => (
            <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={tab !== t.id} className="tabpanel" tabIndex={0}>
              {t.id === "releases" && <Releases a={a} steamEvents={steamEvents} onCall={showCall} />}
              {t.id === "calls" && <Calls a={a} />}
              {t.id === "agent" && <Agent a={a} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


"use client";

import { shortDate } from "@/lib/dates";
import { listNames } from "@/lib/present";
import type { Analysis } from "@/lib/types";
import { ArrowLeft } from "../Icons";

/** Sticky bar on the result: says what is on screen and offers the next action. */
export default function ContextBar(props: { analysis: Analysis; onCheckOwn: () => void; onEdit?: () => void }) {
  const a = props.analysis;
  const example = a.mode === "example";
  const year = (iso: string) => iso.slice(0, 4);
  const win = `${shortDate(a.window.start).split(" ")[0]} ${year(a.window.start)} to ${shortDate(a.window.end).split(" ")[0]} ${year(a.window.end)}`;
  return (
    <div className="ctx" role="region" aria-label="What you are viewing">
      <div className="wrap ctx-in">
        <p className="ctx-what">
          <span className={`ctx-tag ${example ? "" : "is-mine"}`}>{example ? "Example" : "Your game"}</span>
          <span className="ctx-text" title={`${a.label}: players like ${listNames(a.audience.map((g) => g.name))}, ${win}`}>
            <strong className="ctx-name">{a.label}</strong>
            <span className="ctx-sub">
              Players like {listNames(a.audience.map((g) => g.name))}, {win}
            </span>
          </span>
        </p>
        <nav className="ctx-nav" aria-label="Result sections">
          <a href="#calendar">Calendar</a>
          <a href="#how-to-read">How to read</a>
          <a href="#sources">Sources</a>
        </nav>
        <div className="ctx-actions">
          {example ? (
            <button type="button" className="btn btn-sm" onClick={props.onCheckOwn}>
              <span className="ctx-long">Check your own game</span>
              <span className="ctx-short" aria-hidden="true">Check yours</span>
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-quiet" onClick={props.onEdit}>
              <ArrowLeft size={15} /> <span className="ctx-long">Change games</span>
              <span className="ctx-short" aria-hidden="true">Change</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

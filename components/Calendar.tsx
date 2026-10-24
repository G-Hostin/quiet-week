"use client";

import { useEffect, useRef, useState } from "react";
import { monthName, parseDay, shortDate } from "@/lib/dates";
import { barHeight, LEVEL_TEXT } from "@/lib/format";
import type { Analysis, SteamEvent } from "@/lib/types";
import WeekCard from "./WeekCard";

export default function Calendar(props: {
  analysis: Analysis;
  selected: string;
  onSelect: (start: string) => void;
  steamEvents: SteamEvent[];
}) {
  const { analysis: a } = props;
  const byKey = new Map(a.releases.map((r) => [r.key, r]));
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const scroller = useRef<HTMLDivElement | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const idx = Math.max(0, a.weeks.findIndex((w) => w.start === props.selected));

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [a.weeks.length]);
  const week = a.weeks[idx];
  const recommended = new Set(a.verdict.recommended.map((p) => p.weekStart));
  const avoid = new Set(a.verdict.avoid.map((p) => p.weekStart));

  function onKey(e: React.KeyboardEvent, i: number) {
    let j = i;
    if (e.key === "ArrowRight") j = Math.min(a.weeks.length - 1, i + 1);
    else if (e.key === "ArrowLeft") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = a.weeks.length - 1;
    else return;
    e.preventDefault();
    props.onSelect(a.weeks[j].start);
    refs.current[j]?.focus();
  }

  return (
    <section className="section" id="calendar" aria-labelledby="calendar-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="calendar-title">The calendar</h2>
          <p className="muted">
            One bar per week. Height and colour show how much that week&apos;s big releases share your players. Pick a
            week to see what lands and why.
          </p>
        </div>
        <div className="cal card">
          <p className="swipe-hint tiny muted">Swipe sideways for all {a.weeks.length} weeks.</p>
          <div className={`cal-scroll ${atEnd ? "at-end" : ""}`} ref={scroller}>
            <div className="meter" role="radiogroup" aria-label="Weeks of the launch window" style={{ gridTemplateColumns: `repeat(${a.weeks.length}, minmax(26px, 1fr))` }}>
              {a.weeks.map((w, i) => {
                const first = i === 0 || monthName(w.start) !== monthName(a.weeks[i - 1].start);
                const top = w.peakKey ? byKey.get(w.peakKey) : undefined;
                const label = `Week of ${shortDate(w.start)}: ${LEVEL_TEXT[w.level]}${top ? `, ${top.title} ${top.affinity?.toFixed(2)}` : ""}${w.steamEvents.length ? ", Steam event" : ""}`;
                return (
                  <div className="meter-col" key={w.start}>
                    <span className="meter-month" aria-hidden="true">{first ? monthName(w.start) : ""}</span>
                    <button
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={w.start === week.start}
                      tabIndex={w.start === week.start ? 0 : -1}
                      aria-label={label}
                      className={`bar-btn lvl-${w.level}`}
                      onClick={() => props.onSelect(w.start)}
                      onKeyDown={(e) => onKey(e, i)}
                    >
                      <span className="bar" style={{ height: `${Math.round(barHeight(w.level, w.peak) * 100)}%` }} />
                    </button>
                    <span className="meter-day num" aria-hidden="true">{parseDay(w.start).getUTCDate()}</span>
                    <span className="meter-marks" aria-hidden="true">
                      {w.steamEvents.length > 0 && <i className="mark-steam" title="Steam storewide event" />}
                      {recommended.has(w.start) && <i className="mark-pick" title="Recommended" />}
                      {avoid.has(w.start) && <i className="mark-avoid" title="Avoid" />}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <ul className="legend small" aria-label="Legend">
            <li><i className="sw lvl-clash" /> Shared players</li>
            <li><i className="sw lvl-overlap" /> Some overlap</li>
            <li><i className="sw lvl-clear" /> Different players</li>
            <li><i className="sw lvl-open" /> No big release</li>
            <li><i className="mark-steam" /> Steam sale or Next Fest</li>
            <li><i className="mark-pick" /> Recommended</li>
            <li><i className="mark-avoid" /> Avoid</li>
          </ul>
          <WeekCard week={week} analysis={a} steamEvents={props.steamEvents} />
        </div>
      </div>
    </section>
  );
}

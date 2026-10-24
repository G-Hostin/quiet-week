"use client";

import { useEffect, useRef, useState } from "react";
import { longDate, monthName, parseDay, shortDate } from "@/lib/dates";
import { aff, barHeight, LEVEL_TEXT } from "@/lib/format";
import type { Analysis, SteamEvent } from "@/lib/types";
import { Tap } from "../Icons";
import WeekDetail from "./WeekDetail";

function PickMark() {
  return (
    <svg className="mk mk-pick" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="6" />
      <path d="M3.4 6.2l1.8 1.8 3.4-3.8" />
    </svg>
  );
}

function AvoidMark() {
  return (
    <svg className="mk mk-avoid" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="6" />
      <path d="M3.8 3.8l4.4 4.4M8.2 3.8l-4.4 4.4" />
    </svg>
  );
}

function SteamMark() {
  return (
    <svg className="mk mk-steam" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1" transform="rotate(45 6 6)" />
    </svg>
  );
}

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
  const [edge, setEdge] = useState({ start: true, end: false });
  const idx = Math.max(0, a.weeks.findIndex((w) => w.start === props.selected));
  const week = a.weeks[idx];
  const recommended = new Set(a.verdict.recommended.map((p) => p.weekStart));
  const avoid = new Set(a.verdict.avoid.map((p) => p.weekStart));

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [a.weeks.length]);

  // Keep the selected bar visible inside the horizontal scroller (phones), without scrolling the page.
  useEffect(() => {
    const el = scroller.current;
    const btn = refs.current[idx];
    if (!el || !btn || el.scrollWidth <= el.clientWidth) return;
    const col = btn.parentElement as HTMLElement;
    const left = col.offsetLeft - el.clientWidth / 2 + col.offsetWidth / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [idx]);

  function onKey(e: React.KeyboardEvent, i: number) {
    let j = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = Math.min(a.weeks.length - 1, i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = a.weeks.length - 1;
    else return;
    e.preventDefault();
    props.onSelect(a.weeks[j].start);
    refs.current[j]?.focus();
  }

  return (
    <section className="res-sec" id="calendar" aria-labelledby="calendar-title">
      <div className="sec-head">
        <h2 id="calendar-title">Week by week</h2>
        <p>
          One bar per week. The taller and redder the bar, the more that week&apos;s biggest release shares your players.
        </p>
      </div>
      <div className="cal">
        <p className="cal-how">
          <Tap size={18} />
          <span>
            <strong>Click a bar</strong> to see what launches that week.
            <span className="cal-how-swipe"> Swipe sideways for all {a.weeks.length} weeks.</span>
          </span>
        </p>
        <div className={`cal-scroll ${edge.start ? "at-start" : ""} ${edge.end ? "at-end" : ""}`} ref={scroller}>
          <div
            className="meter"
            role="radiogroup"
            aria-label="Weeks of your launch window. Use the arrow keys to move between weeks."
            style={{ gridTemplateColumns: `repeat(${a.weeks.length}, minmax(0, 1fr))` }}
          >
            {a.weeks.map((w, i) => {
              const first = i === 0 || monthName(w.start) !== monthName(a.weeks[i - 1].start);
              const top = w.peakKey ? byKey.get(w.peakKey) : undefined;
              const on = w.start === week.start;
              const tag = recommended.has(w.start) ? ", best week" : avoid.has(w.start) ? ", week to avoid" : "";
              const label = `Week of ${shortDate(w.start)}: ${LEVEL_TEXT[w.level]}${top ? `, ${top.title} ${aff(top.affinity)}` : ""}${tag}${w.steamEvents.length ? ", Steam event" : ""}`;
              return (
                <div className={`meter-col ${on ? "is-on" : ""}`} key={w.start}>
                  <span className="meter-month" aria-hidden="true">{first ? monthName(w.start) : ""}</span>
                  <button
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    aria-label={label}
                    aria-controls="week-detail"
                    className={`bar-btn lvl-${w.level}`}
                    onClick={() => props.onSelect(w.start)}
                    onKeyDown={(e) => onKey(e, i)}
                  >
                    <span className="bar" style={{ height: `${Math.round(barHeight(w.level, w.peak) * 100)}%` }} />
                  </button>
                  <span className="meter-day num" aria-hidden="true">{parseDay(w.start).getUTCDate()}</span>
                  <span className="meter-marks" aria-hidden="true">
                    {recommended.has(w.start) && <PickMark />}
                    {avoid.has(w.start) && <AvoidMark />}
                    {w.steamEvents.length > 0 && <SteamMark />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ul className="legend" aria-label="Legend">
          <li><i className="sw lvl-clash" /> Shared players</li>
          <li><i className="sw lvl-overlap" /> Some overlap</li>
          <li><i className="sw lvl-clear" /> Different players</li>
          <li><i className="sw lvl-open" /> No big release</li>
          <li><PickMark /> Best week</li>
          <li><AvoidMark /> Avoid</li>
          <li><SteamMark /> Steam sale or Next Fest</li>
        </ul>
        <WeekDetail
          key={week.start}
          week={week}
          analysis={a}
          steamEvents={props.steamEvents}
          prev={idx > 0 ? a.weeks[idx - 1].start : null}
          next={idx < a.weeks.length - 1 ? a.weeks[idx + 1].start : null}
          onSelect={props.onSelect}
        />
        <p className="sr-only" aria-live="polite">Showing the week of {longDate(week.start)}.</p>
      </div>
    </section>
  );
}

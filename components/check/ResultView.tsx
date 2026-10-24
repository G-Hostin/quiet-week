"use client";

import { useEffect, useState } from "react";
import { defaultWeek } from "@/lib/present";
import type { Analysis, SteamEvent } from "@/lib/types";
import ContextBar from "../result/ContextBar";
import Answer from "../result/Answer";
import Calendar from "../result/Calendar";
import HowToRead from "../result/HowToRead";
import Sources from "../result/Sources";
import ExampleCards from "../ExampleCards";
import { ArrowRight } from "../Icons";

/** Step 3: the answer first, then the calendar, how to read it, and the sources. */
export default function ResultView(props: {
  analysis: Analysis;
  examples: Analysis[];
  steamEvents: SteamEvent[];
  calendarUpdated: string;
  onCheckOwn: () => void;
  onEdit: () => void;
  onExample: (id: string) => void;
}) {
  const a = props.analysis;
  const [week, setWeek] = useState(() => defaultWeek(a));
  const [scrollTick, setScrollTick] = useState(0);

  useEffect(() => {
    if (scrollTick) document.getElementById("calendar")?.scrollIntoView({ block: "start" });
  }, [scrollTick]);

  return (
    <>
      <ContextBar analysis={a} onCheckOwn={props.onCheckOwn} onEdit={props.onEdit} />
      <div className="result">
        <Answer
          analysis={a}
          onShowWeek={(s) => {
            setWeek(s);
            setScrollTick((n) => n + 1);
          }}
        />
        <div className="band band-work res-work">
          <div className="wrap">
            <Calendar analysis={a} selected={week} onSelect={setWeek} steamEvents={props.steamEvents} />
          </div>
        </div>
        <div className="band band-ref res-ref">
          <div className="wrap">
            <HowToRead rule={a.evidence.rule} calendarUpdated={props.calendarUpdated} />
            <Sources analysis={a} steamEvents={props.steamEvents} />
          </div>
        </div>

        <section className="band band-dark res-next" aria-labelledby="next-title">
          <div className="wrap">
            {a.mode === "example" ? (
              <div className="next-grid">
                <div className="next-own">
                  <h2 id="next-title">Now check your own game</h2>
                  <p className="next-lede">Name a few games your players love. The agent does the rest in under a minute.</p>
                  <p className="next-note">You get the same answer, calendar and sources for your audience.</p>
                  <button type="button" className="btn btn-lg" onClick={props.onCheckOwn}>
                    Check my launch window <ArrowRight size={16} />
                  </button>
                </div>
                <div className="next-more">
                  <p className="next-l">Or open another example</p>
                  <ExampleCards examples={props.examples} exclude={a.id} onOpen={props.onExample} compact />
                </div>
              </div>
            ) : (
              <div className="next-own">
                <h2 id="next-title">Try other games</h2>
                <p className="next-lede">Describe your players with different games to see how the weeks change.</p>
                <p className="next-note">Your games and launch window are kept, so you can adjust them.</p>
                <button type="button" className="btn btn-lg" onClick={props.onEdit}>
                  Change games or window <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Analysis, SteamEvent } from "@/lib/types";
import Header from "./Header";
import Hero from "./Hero";
import YourGame from "./YourGame";
import Calendar from "./Calendar";
import Verdict from "./Verdict";
import Evidence from "./Evidence";
import GameForm from "./GameForm";
import Footer from "./Footer";

const GTA_KEY = "gta6";

function defaultWeek(a: Analysis): string {
  const gta = a.weeks.find((w) => w.releaseKeys.includes(GTA_KEY));
  return (gta ?? a.weeks[0]).start;
}

export default function QuietWeek(props: { examples: Analysis[]; calendarUpdated: string; steamEvents: SteamEvent[] }) {
  const startId = props.examples.find((e) => e.id === "action-western")?.id ?? props.examples[0].id;
  const [live, setLive] = useState<Analysis | null>(null);
  const [activeId, setActiveId] = useState<string>(startId);
  const [formOpen, setFormOpen] = useState(false);
  // Scroll only after React has rendered the new layout (the form may just have been removed).
  const [scrollTo, setScrollTo] = useState<{ id: string; n: number } | null>(null);
  const analysis = useMemo(
    () => (activeId === "live" && live ? live : props.examples.find((e) => e.id === activeId) ?? props.examples[0]),
    [activeId, live, props.examples],
  );
  const [week, setWeek] = useState<string>(defaultWeek(analysis));

  useEffect(() => {
    if (scrollTo) document.getElementById(scrollTo.id)?.scrollIntoView({ block: "start" });
  }, [scrollTo]);

  const go = useCallback((id: string) => setScrollTo((s) => ({ id, n: (s?.n ?? 0) + 1 })), []);

  const choose = useCallback(
    (id: string) => {
      const next = id === "live" && live ? live : props.examples.find((e) => e.id === id);
      if (!next) return;
      setActiveId(id);
      setFormOpen(false);
      setWeek(defaultWeek(next));
    },
    [live, props.examples],
  );

  const onLive = useCallback(
    (a: Analysis) => {
      setLive(a);
      setActiveId("live");
      setFormOpen(false);
      setWeek(defaultWeek(a));
      go("game");
    },
    [go],
  );

  const showWeek = useCallback(
    (start: string) => {
      setWeek(start);
      go("calendar");
    },
    [go],
  );

  const openForm = useCallback(() => {
    setFormOpen(true);
    go("try");
  }, [go]);

  const openExample = useCallback(
    (id: string) => {
      choose(id);
      go("calendar");
    },
    [choose, go],
  );

  return (
    <>
      <Header onTry={openForm} />
      <main>
        <Hero
          examples={props.examples}
          activeId={activeId}
          hasLive={!!live}
          liveLabel={live?.label}
          onChoose={choose}
          onOpen={openExample}
          onTry={openForm}
          formOpen={formOpen}
        />
        {formOpen && <GameForm onDone={onLive} onCancel={() => setFormOpen(false)} />}
        <YourGame analysis={analysis} />
        <Calendar analysis={analysis} selected={week} onSelect={setWeek} steamEvents={props.steamEvents} />
        <Verdict analysis={analysis} onShowWeek={showWeek} />
        <Evidence analysis={analysis} calendarUpdated={props.calendarUpdated} steamEvents={props.steamEvents} />
      </main>
      <Footer />
    </>
  );
}

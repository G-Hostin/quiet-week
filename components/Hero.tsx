import type { Analysis } from "@/lib/types";
import { aff } from "@/lib/format";
import Contrast from "./Contrast";

export default function Hero(props: {
  examples: Analysis[];
  activeId: string;
  hasLive: boolean;
  liveLabel?: string;
  onChoose: (id: string) => void;
  onOpen: (id: string) => void;
  onTry: () => void;
  formOpen: boolean;
}) {
  const western = props.examples.find((e) => e.id === "action-western") ?? props.examples[0];
  const farm = props.examples.find((e) => e.id === "cozy-farm") ?? props.examples[1];
  const open = props.onOpen;
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1>Should you move your launch?</h1>
          <p className="hero-lede">
            Quiet Week measures whether the big release next to yours shares your players. GTA VI lands on November{"\u00a0"}19.
            For an action western, Qloo puts the overlap at {aff(western.verdict.gta.affinity)}; for a cozy farming game,{" "}
            {aff(farm.verdict.gta.affinity)}. Same week, opposite advice.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn" onClick={props.onTry} aria-expanded={props.formOpen} aria-controls="try">
              Test your own game
            </button>
            <a className="btn btn-ghost" href="#calendar">See the full calendar</a>
          </div>
          <p className="tiny muted">About 10 to 20 seconds. An AI agent finds your comparable games in Qloo and shows every step.</p>
        </div>
        <Contrast first={western} second={farm} onOpen={open} />
      </div>
      <div className="wrap">
        <div className="picker" role="group" aria-label="Choose the analysis shown below">
          <span className="picker-label small">Showing</span>
          <div className="chips">
            {props.examples.map((e) => (
              <button key={e.id} type="button" className="chip" aria-pressed={props.activeId === e.id} onClick={() => props.onChoose(e.id)}>
                <span className="chip-label">{e.label}</span>
                <span className="chip-sub">like {e.audience[0]?.name}</span>
              </button>
            ))}
            {props.hasLive && (
              <button type="button" className="chip chip-live" aria-pressed={props.activeId === "live"} onClick={() => props.onChoose("live")}>
                <span className="chip-label">{props.liveLabel || "Your game"}</span>
                <span className="chip-sub">your analysis</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { monthName } from "@/lib/dates";
import { aff, barHeight } from "@/lib/format";
import type { Analysis } from "@/lib/types";

/** Hero visual: the same release calendar measured for two audiences. */
function MiniMeter({ a, onOpen }: { a: Analysis; onOpen: () => void }) {
  const gtaIdx = a.weeks.findIndex((w) => w.releaseKeys.includes("gta6"));
  return (
    <button type="button" className="mini" onClick={onOpen} aria-label={`Open the ${a.label} example`}>
      <span className="mini-head">
        <span className="mini-name">{a.label}</span>
        <span className={`mini-gta gta-${a.verdict.gta.answer}`}>
          GTA VI <strong className="num">{aff(a.verdict.gta.affinity)}</strong>
        </span>
      </span>
      <span className="mini-bars" style={{ gridTemplateColumns: `repeat(${a.weeks.length}, 1fr)` }} aria-hidden="true">
        {a.weeks.map((w, i) => (
          <span key={w.start} className={`mini-col lvl-${w.level} ${i === gtaIdx ? "is-gta" : ""}`}>
            <span className="mini-bar" style={{ height: `${Math.round(barHeight(w.level, w.peak) * 100)}%` }} />
          </span>
        ))}
      </span>
    </button>
  );
}

export default function Contrast(props: { first: Analysis; second: Analysis; onOpen: (id: string) => void }) {
  const weeks = props.first.weeks;
  const gtaIdx = weeks.findIndex((w) => w.releaseKeys.includes("gta6"));
  const months = weeks.map((w, i) => (i === 0 || monthName(w.start) !== monthName(weeks[i - 1].start) ? monthName(w.start) : ""));
  return (
    <figure className="contrast card">
      <figcaption className="contrast-cap">
        <span>Same 21 weeks, two audiences</span>
        <span className="muted small">Nov 2026 to Mar 2027</span>
      </figcaption>
      <MiniMeter a={props.first} onOpen={() => props.onOpen(props.first.id)} />
      <MiniMeter a={props.second} onOpen={() => props.onOpen(props.second.id)} />
      <div className="mini-axis" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} aria-hidden="true">
        {months.map((m, i) => (
          <span key={i} className={i === gtaIdx ? "is-gta" : ""}>{i === gtaIdx ? "GTA VI" : m}</span>
        ))}
      </div>
      <p className="tiny muted contrast-note">
        Bar height and colour: Qloo affinity between each audience and that week&apos;s biggest release. GTA VI is measured
        through GTA V, since Qloo does not score it before launch.
      </p>
    </figure>
  );
}

import { monthName } from "@/lib/dates";
import { aff, barHeight } from "@/lib/format";
import { answerFor, listNames } from "@/lib/present";
import type { Analysis } from "@/lib/types";

/** Landing figure (not interactive): the same 21 weeks measured for two audiences. */
function Row({ a }: { a: Analysis }) {
  const gtaIdx = a.weeks.findIndex((w) => w.releaseKeys.includes("gta6"));
  const gta = a.releases.find((r) => r.key === "gta6");
  return (
    <div className="fig-row">
      <div className="fig-row-head">
        <p className="fig-name">
          {a.label}
          <span className="fig-like">players like {listNames(a.audience.slice(0, 1).map((g) => g.name))}</span>
        </p>
        {gta && (
          <p className={`fig-gta lvl-${gta.level}`}>
            <span className="fig-gta-k">GTA VI</span>
            <strong className="num">{aff(gta.affinity)}</strong>
          </p>
        )}
      </div>
      <div className="fig-bars" style={{ gridTemplateColumns: `repeat(${a.weeks.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {a.weeks.map((w, i) => (
          <span key={w.start} className={`fig-col lvl-${w.level} ${i === gtaIdx ? "is-gta" : ""}`}>
            <span className="fig-bar" style={{ height: `${Math.round(barHeight(w.level, w.peak) * 100)}%` }} />
          </span>
        ))}
      </div>
      <p className={`fig-advice lvl-${gta?.level ?? "open"}`}>{answerFor(a).text}</p>
    </div>
  );
}

export default function HeroFigure({ first, second }: { first: Analysis; second: Analysis }) {
  const weeks = first.weeks;
  const gtaIdx = weeks.findIndex((w) => w.releaseKeys.includes("gta6"));
  const months = weeks.map((w, i) => (i === 0 || monthName(w.start) !== monthName(weeks[i - 1].start) ? monthName(w.start) : ""));
  return (
    <figure className="fig panel">
      <figcaption className="fig-cap">
        <strong>Same week, opposite advice</strong>
        <span className="small muted">
          One bar per week, November to March. The taller and redder the bar, the more that week&apos;s big release
          shares these players.
        </span>
      </figcaption>
      <Row a={first} />
      <Row a={second} />
      <div className="fig-axis" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {months.map((m, i) => (
          <span key={i} className={i === gtaIdx ? "is-gta" : ""}>
            {i === gtaIdx ? "GTA VI" : m}
          </span>
        ))}
      </div>
    </figure>
  );
}

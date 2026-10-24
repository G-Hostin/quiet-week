import { shortDate } from "@/lib/dates";
import { aff, hostOf, kindLabel, measuredAs } from "@/lib/format";
import type { Analysis, SteamEvent } from "@/lib/types";
import RuleBox from "./RuleBox";
import CallList from "./CallList";
import AgentLog from "./AgentLog";

export default function Evidence(props: { analysis: Analysis; calendarUpdated: string; steamEvents: SteamEvent[] }) {
  const a = props.analysis;
  const rows = [...a.releases].sort((x, y) => (y.affinity ?? -1) - (x.affinity ?? -1));
  return (
    <section className="section" id="evidence" aria-labelledby="evidence-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="evidence-title">The evidence</h2>
          <p className="muted">Every number above comes from one of these Qloo calls, and every date from one of these sources.</p>
        </div>

        <div className="limits card">
          <h3>Read this before you move your date</h3>
          <ul>
            <li><strong>Affinity is not sales.</strong> It is Qloo&apos;s 0 to 1 score of how much two audiences like the same things. It is not a share of players, and Quiet Week makes no sales forecast.</li>
            <li><strong>Stand-ins.</strong> Qloo does not score games or films before they come out. For those, Quiet Week measures an earlier game or film of the same series (GTA V for GTA VI) and says so next to every number.</li>
            <li><strong>Dates move.</strong> Each date was checked by hand on {shortDate(props.calendarUpdated)}, 2026 against the linked source. Check again before you commit.</li>
            <li><strong>Small games.</strong> Qloo has little data on very small titles, so you describe your players with 1 to 3 well-known games instead of your own.</li>
          </ul>
        </div>

        <RuleBox rule={a.evidence.rule} />

        <details className="ev card" open>
          <summary><h3>Every release, its score and its source</h3></summary>
          <div className="table-wrap">
            <table className="ev-table small">
              <thead>
                <tr><th scope="col">Release</th><th scope="col">Date</th><th scope="col" className="r">Affinity</th><th scope="col">Measured</th><th scope="col">Call</th><th scope="col">Date source</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className={`lvl-${r.level}`}>
                    <th scope="row"><span className="rel-dot" aria-hidden="true" /> {r.title} <span className="muted">{kindLabel(r.kind)}</span></th>
                    <td className="num">{shortDate(r.date)}</td>
                    <td className="num r">{aff(r.affinity)}</td>
                    <td>{measuredAs(r)}</td>
                    <td className="num">{r.callIndex !== undefined ? <a href={`#call-${r.callIndex + 1}`}>#{r.callIndex + 1}</a> : "none"}</td>
                    <td><a href={r.source.url} target="_blank" rel="noopener noreferrer">{r.source.publisher}</a> <span className="muted">{hostOf(r.source.url)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tiny muted">Steam events: {props.steamEvents.map((e) => `${e.title} ${shortDate(e.start)} to ${shortDate(e.end)}`).join("; ")}. Source: <a href={props.steamEvents[0]?.source.url} target="_blank" rel="noopener noreferrer">Valve, Steamworks documentation</a>.</p>
        </details>

        <CallList analysis={a} />
        <AgentLog analysis={a} />
      </div>
    </section>
  );
}

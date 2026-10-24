import type { Analysis } from "@/lib/types";

const KIND: Record<string, string> = {
  "urn:entity:videogame": "games",
  "urn:entity:movie": "films",
};

export default function CallList({ analysis }: { analysis: Analysis }) {
  const a = analysis;
  const names = a.evidence.names;
  const audience = new Map(a.audience.map((g) => [g.id, g.name]));
  return (
    <details className="ev card">
      <summary><h3>The exact Qloo calls ({a.evidence.calls.length})</h3></summary>
      <p className="small muted">
        Endpoint <code>GET https://hackathon.api.qloo.com/v2/insights</code>. The signal is your audience games; the
        filter is the list of releases (or stand-ins) to score. Qloo returns one affinity per entity it can score and
        leaves the rest out. The API key stays on the server.
      </p>
      <ol className="calls">
        {a.evidence.calls.map((c, i) => {
          const sig = (c.params["signal.interests.entities"] || "").split(",").filter(Boolean);
          const tgt = (c.params["filter.results.entities"] || c.params["filter.entities"] || "").split(",").filter(Boolean);
          const scored = tgt.filter((id) => names[id]);
          return (
            <li key={i} id={`call-${i + 1}`} className="call">
              <p className="call-head">
                <strong>Call #{i + 1}</strong> scores {tgt.length} {KIND[c.params["filter.type"]] || "entities"}, {c.resultCount} came back with an affinity{" "}
                <span className="muted small">(HTTP {c.status}, {c.cached ? "served from cache" : `${c.ms} ms`})</span>
              </p>
              <dl className="call-params small">
                <dt>filter.type</dt>
                <dd><code>{c.params["filter.type"]}</code></dd>
                <dt>signal.interests.entities</dt>
                <dd>{sig.map((id) => <span key={id} className="idchip"><code>{id}</code> {audience.get(id) || ""}</span>)}</dd>
                <dt>filter.results.entities</dt>
                <dd>
                  {tgt.map((id) => (
                    <span key={id} className={`idchip ${names[id] ? "" : "is-missing"}`} title={names[id] ? "scored" : "no score returned"}>
                      <code>{id.slice(0, 8)}</code> {names[id] || "no score"}
                    </span>
                  ))}
                </dd>
                <dt>take</dt>
                <dd><code>{c.params.take}</code></dd>
              </dl>
              <p className="tiny muted">{scored.length} of {tgt.length} entities scored.</p>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

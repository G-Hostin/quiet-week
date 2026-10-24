import { longDate } from "@/lib/dates";
import Cover from "./Cover";
import type { Analysis } from "@/lib/types";

export default function YourGame({ analysis }: { analysis: Analysis }) {
  const a = analysis;
  return (
    <section className="section" id="game" aria-labelledby="game-title">
      <div className="wrap">
        <div className="game card">
          <div className="game-main">
            <p className="game-kicker small muted">{a.mode === "example" ? "Example" : "Your game"}</p>
            <h2 id="game-title">{a.label}</h2>
            {a.pitch && <p className="game-pitch">{a.pitch}</p>}
            <p className="small muted">
              Launch window: {longDate(a.window.start)} to {longDate(a.window.end)}
            </p>
          </div>
          <div className="game-audience">
            <p className="small muted">Players like the players of</p>
            <ul className="covers">
              {a.audience.map((g) => (
                <li key={g.id} className="cover">
                  <Cover src={g.image} name={g.name} w={36} h={46} />
                  <span className="cover-name">
                    {g.name}
                    {g.year && <span className="muted"> · {g.year}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="tiny muted">Cover images from Qloo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

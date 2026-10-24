import Link from "next/link";
import { aff } from "@/lib/format";
import { answerFor, listNames } from "@/lib/present";
import type { Analysis } from "@/lib/types";
import Cover from "./Cover";
import { ArrowRight } from "./Icons";

function Body({ a }: { a: Analysis }) {
  const gta = a.releases.find((r) => r.key === "gta6");
  return (
    <>
      <span className="ex-top">
        <span className="ex-covers" aria-hidden="true">
          {a.audience.map((g) => (
            <Cover key={g.id} src={g.image} name={g.name} w={30} h={40} />
          ))}
        </span>
        <span className="ex-name">{a.label}</span>
      </span>
      <span className="ex-like">Players like {listNames(a.audience.map((g) => g.name))}</span>
      {gta && (
        <span className={`ex-answer lvl-${gta.level}`}>
          <span className="ex-answer-a">
            <span className="dot" aria-hidden="true" />
            {answerFor(a).text}
          </span>
          <span className="ex-answer-n">
            GTA VI player overlap: <strong className="num">{aff(gta.affinity)}</strong>
          </span>
        </span>
      )}
      <span className="ex-go">
        Open example <ArrowRight size={15} />
      </span>
    </>
  );
}

/** The three ready-made examples. Links on the landing page, buttons inside the tool. */
export default function ExampleCards(props: { examples: Analysis[]; onOpen?: (id: string) => void; exclude?: string; compact?: boolean }) {
  const list = props.examples.filter((e) => e.id !== props.exclude);
  return (
    <ul className={`ex-list ${props.compact ? "is-compact" : ""}`}>
      {list.map((a) => (
        <li key={a.id}>
          {props.onOpen ? (
            <button type="button" className="ex-card" onClick={() => props.onOpen!(a.id)}>
              <Body a={a} />
            </button>
          ) : (
            <Link className="ex-card" href={`/check?example=${a.id}`}>
              <Body a={a} />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

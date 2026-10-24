import Link from "next/link";

export function Mark() {
  const h = [7, 12, 18, 9, 5];
  return (
    <span className="wordmark-mark" aria-hidden="true">
      {h.map((v, i) => (
        <i key={i} style={{ height: v, background: i === 2 ? "var(--clash)" : undefined }} />
      ))}
    </span>
  );
}

/** Site header. On the landing page it links to its sections; in the tool it links back home. */
export default function SiteHeader({ page }: { page: "home" | "check" }) {
  return (
    <header className="site-head">
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap site-head-in">
        <Link className="wordmark" href="/" aria-label="Quiet Week, home">
          <Mark />
          Quiet Week
        </Link>
        <nav className="site-nav" aria-label="Main">
          {page === "home" ? (
            <>
              <a className="nav-link" href="#how">How it works</a>
              <a className="nav-link" href="#examples">Examples</a>
              <Link className="btn btn-sm" href="/check">
                <span className="cta-long">Check my launch window</span>
                <span className="cta-short" aria-hidden="true">Check my window</span>
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-link" href="/#how">How it works</Link>
              <Link className="nav-link" href="/#examples">Examples</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

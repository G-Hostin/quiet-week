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

export default function Header({ onTry }: { onTry: () => void }) {
  return (
    <header className="top">
      <div className="wrap">
        <a className="wordmark" href="#top">
          <Mark />
          Quiet Week
        </a>
        <nav className="nav" aria-label="Sections">
          <a className="nav-section" href="#calendar">Calendar</a>
          <a className="nav-section" href="#verdict">Verdict</a>
          <a className="nav-section" href="#evidence">Evidence</a>
        </nav>
        <button type="button" className="btn btn-small" onClick={onTry}>
          Test your game
        </button>
      </div>
    </header>
  );
}

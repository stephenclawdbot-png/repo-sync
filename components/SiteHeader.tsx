import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="wrap site-header">
      <Link href="/" className="logo" aria-label="Stagepass home">
        <span className="logo__mark" aria-hidden="true" />
        stagepass
      </Link>
      <nav className="site-nav" aria-label="Main">
        <Link href="/#events">Events</Link>
        <Link href="/#ways">Ways in</Link>
        <Link href="/#stubs">Stubs</Link>
        <Link href="/studio">Design studio</Link>
        <Link href="/organizers">For organizers</Link>
      </nav>
      <Link href="/me" className="btn btn--ink btn--sm">
        My tickets
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div className="stack" style={{ maxWidth: "46ch" }}>
          <span className="logo">
            <span className="logo__mark" aria-hidden="true" />
            stagepass
          </span>
          <p className="muted">
            A working prototype. Payments run in sandbox mode, so nothing is charged, and the events are demo events.
          </p>
        </div>
        <nav className="site-nav" aria-label="Footer">
          <Link href="/me">My tickets</Link>
          <Link href="/scan">Door scanner</Link>
          <Link href="/studio">Design studio</Link>
          <Link href="/organizers">For organizers</Link>
        </nav>
      </div>
    </footer>
  );
}

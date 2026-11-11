import Link from "next/link";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#events", label: "Events" },
  { href: "/organizers", label: "For organizers" },
  { href: "/studio", label: "Design studio" },
  { href: "/demo", label: "Demo video" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap site-header__in">
        <Link href="/" aria-label="stagepass home" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <HeaderActions links={LINKS} />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div className="stack" style={{ maxWidth: "44ch" }}>
          <Logo height={22} />
          <p className="muted" style={{ fontSize: "0.875rem" }}>
            A working prototype. Payments run in sandbox mode, so nothing is charged, and the events are samples.
          </p>
        </div>
        <nav className="site-nav" aria-label="Footer">
          <Link href="/signup">Sign up</Link>
          <Link href="/dashboard">Back office</Link>
          <Link href="/s/bayfront">Sample storefront</Link>
          <Link href="/me">My tickets</Link>
          <Link href="/scan">Door scanner</Link>
        </nav>
      </div>
    </footer>
  );
}

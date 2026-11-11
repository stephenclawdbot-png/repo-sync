import Link from "next/link";

export function Nav() {
  return (
    <header className="wrap nav">
      <Link href="/" className="brand">
        stage<span>pass</span>
      </Link>
      <nav className="nav-links">
        <Link href="/#payments">Payments</Link>
        <Link href="/#payouts">Payouts</Link>
        <Link href="/#compare">Compare</Link>
        <Link href="/#architecture">Architecture</Link>
        <Link href="/dashboard">Payout simulator</Link>
      </nav>
      <Link href="/e/manila-sound-fest" className="btn primary">
        See a live storefront
      </Link>
    </header>
  );
}

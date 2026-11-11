"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadMerchantSession, useGuest } from "@/lib/guest";

/** Right side of the header. It knows who is signed in on this device, and holds the phone menu. */
export function HeaderActions({ links }: { links: { href: string; label: string }[] }) {
  const { guest } = useGuest();
  const [merchant, setMerchant] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMerchant(Boolean(loadMerchantSession())), [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const signedIn = Boolean(guest?.profile) || merchant;
  const count = guest?.tickets.length ?? 0;

  return (
    <>
      <div className="site-header__actions">
        {merchant && <Link href="/dashboard" className="btn btn--sm btn--hide-sm">Back office</Link>}
        {!signedIn && <Link href="/signup" className="btn btn--sm btn--hide-sm">Sign up</Link>}
        <Link href="/me" className="btn btn--sm btn--primary">
          My tickets{count > 0 && <span className="digits" aria-label={`${count} saved`}>{count}</span>}
        </Link>
        <button className="menu-btn" aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
      <nav id="site-menu" className="menu-sheet" aria-label="Menu" hidden={!open}>
        {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
        <Link href="/me">My tickets and stubs</Link>
        {merchant ? <Link href="/dashboard">Back office</Link> : null}
        {!signedIn ? <Link href="/signup">Sign up or try a demo</Link> : null}
        <Link href="/scan">Door scanner</Link>
      </nav>
    </>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { type EventDef, priceLine } from "@/lib/events";
import { Poster } from "./Poster";

type Ev = Pick<EventDef, "slug" | "title" | "kind" | "dateLabel" | "timeLabel" | "venue" | "city" | "rsvp" | "tiers" | "earn" | "currency" | "design">;

/** Event card: generated poster on top, facts below. `inert` renders it without a link (editor preview). */
export function EventCard({ ev, inert }: { ev: Ev; inert?: boolean }) {
  const body: ReactNode = (
    <>
      <Poster design={ev.design} kind={`${ev.kind} · ${ev.city}`} big={ev.dateLabel.split(" ").slice(1, 3).join(" ")} small />
      <div className="ev-card__body">
        <h3>{ev.title}</h3>
        <p className="muted" style={{ fontSize: "0.875rem" }}>{ev.dateLabel} · {ev.timeLabel} · {ev.venue}</p>
        <p className="ev-card__foot">{priceLine(ev as EventDef)}</p>
      </div>
    </>
  );
  return inert ? <div className="ev-card">{body}</div> : <Link href={`/e/${ev.slug}`} className="ev-card">{body}</Link>;
}

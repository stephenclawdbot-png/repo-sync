import { type Design, designVars, type Via, VIA_LABEL } from "@/lib/events";

export interface TicketProps {
  design: Design;
  kind: string;
  title: string;
  dateLabel: string;
  venue: string;
  org?: string;
  name?: string;
  tier?: string;
  admits?: number;
  via?: Via;
  /** sample: marketing or preview · ticket: live with QR · stub: attended keepsake */
  state: "sample" | "ticket" | "stub";
  qrSvg?: string;
  ticketNo?: string;
  serial?: string;
  /** Text under the placeholder code on samples and account cards. */
  sideNote?: string;
  /** Play the tear once (the ticket was scanned moments ago). */
  fresh?: boolean;
}

/**
 * The one object every way in produces, laid out like a wallet pass: header strip, colour block with the
 * title, a field grid, then a perforation and the code. The same design renders the ticket and the stub.
 */
export function Ticket(p: TicketProps) {
  const label = `${p.state === "stub" ? "Stub" : p.state === "ticket" ? "Ticket" : "Sample ticket"}: ${p.title}`;
  const admits = p.admits ?? 1;
  return (
    <div className="tk-wrap">
      <article
        className={`tk tk--${p.state} ${p.fresh ? "tk--fresh" : ""}`}
        data-pattern={p.design.pattern}
        style={designVars(p.design)}
        aria-label={label}
      >
        <div className="tk__main">
          <div className="tk__head">
            <span className="tk__org">
              <span className="tk__mark" aria-hidden="true">{p.design.glyph}</span>
              {p.org ?? "stagepass"}
            </span>
            {p.via && <span className="tk__way">{VIA_LABEL[p.via]}</span>}
          </div>
          <div className="tk__hero" data-glyph={p.design.glyph}>
            <span className="tk__kind">{p.kind}</span>
            <p className="tk__title">{p.title}</p>
          </div>
          <dl className="tk__meta">
            <div>
              <dt>Date</dt>
              <dd>{p.dateLabel}</dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{p.venue}</dd>
            </div>
            {p.name && (
              <div>
                <dt>Name</dt>
                <dd>{p.name}</dd>
              </div>
            )}
            {p.tier && (
              <div>
                <dt>Ticket</dt>
                <dd>{p.tier}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="tk__side">
          {p.state === "ticket" && p.qrSvg ? (
            <>
              <div className="tk__qr" role="img" aria-label="QR code for this ticket" dangerouslySetInnerHTML={{ __html: p.qrSvg }} />
              <span className="tk__admit">Admit {admits}</span>
              <span className="tk__no">No. {p.ticketNo}</span>
            </>
          ) : p.state === "stub" ? (
            <>
              <div className="tk__seal">
                <small>Attended</small>
                <b>{p.serial}</b>
                <small>Admit {admits}</small>
              </div>
              <span className="tk__no">Stub No. {p.serial}</span>
            </>
          ) : (
            <>
              <div className="tk__ph" aria-hidden="true"><span /></div>
              <span className="tk__admit">Admit {admits}</span>
              <span className="tk__no">{p.sideNote ?? "Your QR appears here"}</span>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

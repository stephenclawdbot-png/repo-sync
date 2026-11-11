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
}

/** The one object every way in produces. The same design renders the ticket, the wallet pass and the stub. */
export function Ticket(p: TicketProps) {
  const label = `${p.state === "stub" ? "Stub" : p.state === "ticket" ? "Ticket" : "Sample ticket"}: ${p.title}`;
  return (
    <div className="tk-wrap">
      <article
        className={`tk ${p.state === "stub" ? "tk--stub" : ""}`}
        data-pattern={p.design.pattern}
        style={designVars(p.design)}
        aria-label={label}
      >
        <div className="tk__main">
          <div className="tk__band">
            <span className="mono">{p.kind}</span>
            <span className="tk__glyph" aria-hidden="true">
              {p.design.glyph}
            </span>
          </div>
          <div className="tk__body">
            <p className="tk__title">{p.title}</p>
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
            <div className="tk__foot mono">
              <span>Admit {p.admits ?? 1}</span>
              {p.via && <span>{VIA_LABEL[p.via]}</span>}
              {p.org && <span>{p.org}</span>}
            </div>
          </div>
        </div>
        <div className="tk__side">
          {p.state === "ticket" && p.qrSvg ? (
            <>
              <div
                className="tk__qr"
                role="img"
                aria-label="QR code for this ticket"
                dangerouslySetInnerHTML={{ __html: p.qrSvg }}
              />
              <span className="tk__no">No. {p.ticketNo}</span>
            </>
          ) : p.state === "stub" ? (
            <>
              <div className="tk__stamp">
                <span className="mono">Attended</span>
                <b>No. {p.serial}</b>
              </div>
              <span className="tk__no">Keep this stub</span>
            </>
          ) : (
            <>
              <div className="tk__admit">
                <span className="mono">Admit</span>
                <br />
                {p.admits && p.admits > 1 ? p.admits : "One"}
              </div>
              <span className="tk__no">{p.ticketNo ? `No. ${p.ticketNo}` : "No. 000000"}</span>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

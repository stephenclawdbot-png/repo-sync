"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { serial } from "@/lib/events";

type Result =
  | { result: "ok"; serial: number; name: string; tier: string; admits: number; via: string }
  | { result: "already"; serial: number; at: number; name: string }
  | { result: "invalid" | "wrong-event" | "cancelled" }
  | { result: "error"; message: string };

interface Log { at: number; text: string; tone: "ok" | "warn" | "bad" }

function describe(r: Result): { tone: "ok" | "warn" | "bad"; title: string; detail: string } {
  switch (r.result) {
    case "ok":
      return { tone: "ok", title: `✓ Admit ${r.admits}`, detail: `${r.name} · ${r.tier} · guest No. ${serial(r.serial)}` };
    case "already":
      return { tone: "warn", title: "↺ Already scanned", detail: `${r.name} came in at ${new Date(r.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} as No. ${serial(r.serial)}. Do not admit again.` };
    case "wrong-event":
      return { tone: "bad", title: "✕ Wrong event", detail: "This ticket is real, but it is for a different event." };
    case "cancelled":
      return { tone: "bad", title: "✕ Cancelled", detail: "This RSVP was changed or cancelled. Ask the guest to open their latest ticket." };
    case "invalid":
      return { tone: "bad", title: "✕ Not a valid ticket", detail: "The code could not be verified." };
    default:
      return { tone: "bad", title: "✕ Could not check", detail: r.message };
  }
}

export function Scanner({ events, initial }: { events: { slug: string; title: string }[]; initial?: string }) {
  const [slug, setSlug] = useState(events.some((e) => e.slug === initial) ? initial! : events[0].slug);
  const [door, setDoor] = useState("");
  const [manual, setManual] = useState("");
  const [camera, setCamera] = useState<"off" | "starting" | "on" | "blocked">("off");
  const [last, setLast] = useState<Result | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const seen = useRef(new Map<string, number>());
  const ctx = useRef({ slug, door });
  ctx.current = { slug, door };

  const check = useCallback(async (code: string) => {
    const now = Date.now();
    if (now - (seen.current.get(code) ?? 0) < 5000) return; // same QR still in front of the camera
    seen.current.set(code, now);
    let r: Result;
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: ctx.current.slug, door: ctx.current.door, code }),
      });
      const data = await res.json();
      r = res.ok ? data : { result: "error", message: data.error ?? "Try again." };
    } catch {
      r = { result: "error", message: "No connection. Check the signal and scan again." };
    }
    setLast(r);
    const d = describe(r);
    setLog((l) => [{ at: now, text: `${d.title} · ${d.detail}`, tone: d.tone }, ...l].slice(0, 12));
    if (navigator.vibrate) navigator.vibrate(d.tone === "ok" ? 80 : [80, 60, 80]);
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera("off");
  }, []);

  async function start() {
    setCamera("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setCamera("on");
    } catch {
      setCamera("blocked");
    }
  }

  useEffect(() => {
    if (camera !== "on" || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});
    const canvas = document.createElement("canvas");
    const c2d = canvas.getContext("2d", { willReadFrequently: true });
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    (async () => {
      const jsQR = (await import("jsqr")).default;
      const tick = () => {
        if (stopped) return;
        if (c2d && video.readyState >= 2 && video.videoWidth) {
          const scale = Math.min(1, 640 / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          c2d.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = c2d.getImageData(0, 0, canvas.width, canvas.height);
          const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (hit?.data) void check(hit.data);
        }
        timer = setTimeout(tick, 220);
      };
      tick();
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [camera, check]);

  useEffect(() => stop, [stop]);

  function submitManual(e: FormEvent) {
    e.preventDefault();
    if (!manual.trim()) return;
    seen.current.delete(manual.trim());
    void check(manual.trim());
    setManual("");
  }

  const shown = last ? describe(last) : null;
  const admitted = log.filter((l) => l.tone === "ok").length;

  return (
    <div className="stack" style={{ "--gap": "18px" } as React.CSSProperties}>
      <div className="row" style={{ alignItems: "end" }}>
        <div className="field" style={{ flex: "2 1 220px" }}>
          <label htmlFor="sc-ev">Event</label>
          <select id="sc-ev" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {events.map((e) => <option key={e.slug} value={e.slug}>{e.title}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: "1 1 130px", marginTop: 0 }}>
          <label htmlFor="sc-door">Door code</label>
          <input id="sc-door" type="text" inputMode="numeric" autoComplete="off" value={door} onChange={(e) => setDoor(e.target.value)} />
        </div>
      </div>

      <div className={`scan-result scan-result--${shown?.tone ?? "idle"}`} role="status" aria-live="assertive">
        {shown ? (
          <>
            <b>{shown.title}</b>
            <span>{shown.detail}</span>
          </>
        ) : (
          <>
            <b>Ready</b>
            <span>Point the camera at a ticket QR, or type the code below.</span>
          </>
        )}
      </div>

      {camera === "on" ? (
        <>
          <div className="scan-view">
            <video ref={videoRef} muted playsInline aria-label="Camera preview" />
            <div className="scan-view__frame" aria-hidden="true" />
          </div>
          <div><button className="btn" onClick={stop}>Stop camera</button></div>
        </>
      ) : (
        <div className="stack">
          <div><button className="btn btn--ink" onClick={start} disabled={camera === "starting"}>{camera === "starting" ? "Starting camera…" : "Start camera"}</button></div>
          {camera === "blocked" && (
            <div className="note note--warn" role="alert"><strong>Camera not available</strong>Allow camera access for this site in your browser settings, or type the ticket code below.</div>
          )}
        </div>
      )}

      <form onSubmit={submitManual} className="field">
        <label htmlFor="sc-manual">Ticket code or link</label>
        <div className="invite">
          <input id="sc-manual" type="text" autoComplete="off" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Paste a ticket link" />
          <button className="btn btn--sm">Check in</button>
        </div>
        <p className="hint">Use this when a screen is cracked or the camera can’t focus.</p>
      </form>

      <section aria-labelledby="sc-log" className="stack">
        <h2 id="sc-log" style={{ fontSize: "1.4rem" }}>This session: {admitted} admitted</h2>
        {log.length === 0 ? <p className="muted">Nothing scanned yet.</p> : (
          <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, "--gap": "8px" } as React.CSSProperties}>
            {log.map((l) => <li key={l.at} className={`note note--${l.tone}`} style={{ padding: "10px 14px" }}>{l.text}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

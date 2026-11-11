"use client";

import { useCallback, useEffect, useState } from "react";

export interface Guest {
  gid: string;
  name: string;
  tickets: string[];
}

const KEY = "stagepass.guest.v1";
let memory: Guest | null = null;
/** Every mounted useGuest() shares one guest, so a ticket issued in one component shows up in the others. */
const listeners = new Set<(g: Guest) => void>();

function newGid(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

function load(): Guest {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (memory = JSON.parse(raw) as Guest);
  } catch {
    /* private mode or blocked storage: fall through to an in-memory guest */
  }
  memory = { gid: newGid(), name: "", tickets: [] };
  save(memory);
  return memory;
}

function save(g: Guest) {
  memory = g;
  try {
    localStorage.setItem(KEY, JSON.stringify(g));
  } catch {
    /* keep working from memory */
  }
  listeners.forEach((l) => l(g));
}

/** Read the unsigned part of a ticket token. Display only; the server verifies the signature. */
export function peek(token: string): { e: string; n: string; g: string; i: string; q: number } | null {
  try {
    const body = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(body))));
  } catch {
    return null;
  }
}

/**
 * The guest's identity on this device: a random id, their name, and the tickets they hold.
 * No account or password. (Production adds a one-time code by phone or email to move it between devices.)
 */
export function useGuest() {
  const [guest, setGuest] = useState<Guest | null>(null);
  useEffect(() => {
    setGuest(load());
    listeners.add(setGuest);
    return () => void listeners.delete(setGuest);
  }, []);

  const update = useCallback((patch: (g: Guest) => Guest) => save(patch(load())), []);

  const setName = useCallback((name: string) => update((g) => ({ ...g, name })), [update]);
  const addTicket = useCallback(
    (token: string) =>
      update((g) => {
        const slug = peek(token)?.e;
        return { ...g, tickets: [token, ...g.tickets.filter((t) => peek(t)?.e !== slug)] };
      }),
    [update],
  );
  const ticketFor = useCallback((slug: string) => guest?.tickets.find((t) => peek(t)?.e === slug), [guest]);

  return { guest, setName, addTicket, ticketFor };
}

/**
 * Tiny append-only record store.
 *
 * Every record is a key such as `tix/<event>/<guest>~<ticket>~rsvp~ga~2`; the data lives in the key,
 * so reads are a single prefix listing. Keys hold random ids only, never names, emails or phones.
 *
 * Backends: Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise process memory (local dev).
 * This is prototype storage. The production design (docs/ARCHITECTURE.md) uses Postgres.
 */
import { del, get, list, put } from "@vercel/blob";

const ROOT = "v1/";

export interface Store {
  put(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  remove(prefix: string): Promise<number>;
  /** Small JSON documents (merchant profiles, merchant-created events). */
  putDoc(key: string, doc: unknown): Promise<void>;
  /** Create `key` only if it does not exist. True if this call created it. */
  claim(key: string): Promise<boolean>;
  getDoc<T>(key: string): Promise<T | null>;
}

const blobStore: Store = {
  async put(key) {
    await put(ROOT + key, "1", {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "text/plain",
    });
  },
  async list(prefix) {
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: ROOT + prefix, limit: 1000, cursor });
      for (const b of page.blobs) out.push(b.pathname.slice(ROOT.length));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  },
  async remove(prefix) {
    let n = 0;
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: ROOT + prefix, limit: 1000, cursor });
      if (page.blobs.length) {
        await del(page.blobs.map((b) => b.url));
        n += page.blobs.length;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return n;
  },
  async putDoc(key, doc) {
    await put(ROOT + key, JSON.stringify(doc), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  },
  async claim(key) {
    try {
      await put(ROOT + key, "1", { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "text/plain" });
      return true;
    } catch {
      return false;
    }
  },
  async getDoc<T>(key: string) {
    const res = await get(ROOT + key, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return (await new Response(res.stream).json()) as T;
  },
};

const g = globalThis as unknown as { __spMem?: Set<string>; __spDocs?: Map<string, string> };
const mem = (g.__spMem ??= new Set<string>());
const docs = (g.__spDocs ??= new Map<string, string>());

const memoryStore: Store = {
  async put(key) {
    mem.add(key);
  },
  async list(prefix) {
    return [...mem].filter((k) => k.startsWith(prefix)).sort();
  },
  async remove(prefix) {
    let n = 0;
    for (const k of [...mem]) if (k.startsWith(prefix)) n += Number(mem.delete(k));
    for (const k of [...docs.keys()]) if (k.startsWith(prefix)) n += Number(docs.delete(k));
    return n;
  },
  async putDoc(key, doc) {
    docs.set(key, JSON.stringify(doc));
  },
  async claim(key) {
    if (mem.has(key)) return false;
    mem.add(key);
    return true;
  },
  async getDoc<T>(key: string) {
    const raw = docs.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
};

export const persistent = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
export const store: Store = persistent ? blobStore : memoryStore;

/** Split the last path segment of a key on `~`. */
export function fields(key: string): string[] {
  return key.slice(key.lastIndexOf("/") + 1).split("~");
}

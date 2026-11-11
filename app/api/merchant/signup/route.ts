import { NextResponse } from "next/server";
import { fail, readJson } from "@/lib/http";
import { createMerchant, merchantKey } from "@/lib/merchants";

export async function POST(req: Request) {
  const body = await readJson<{ name: string; handle: string }>(req);
  if (!body) return fail("Invalid request.");
  const m = await createMerchant(body.name, body.handle);
  if ("error" in m) return fail(m.error, 409);
  return NextResponse.json({ mid: m.mid, key: merchantKey(m.mid), handle: m.handle, name: m.name });
}

import { findEvent } from "@/lib/merchants";
import { checkInStatus } from "@/lib/core";
import { serial } from "@/lib/events";
import { fail } from "@/lib/http";
import { verifyTicket } from "@/lib/token";
import { appleWalletReady, buildApplePass } from "@/lib/wallet/apple";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const claims = verifyTicket(token);
  const ev = claims && (await findEvent(claims.e));
  if (!claims || !ev) return fail("This ticket is not valid.", 404);
  if (!appleWalletReady()) return fail("Apple Wallet is not set up yet: the Apple pass certificate is missing.", 501);
  try {
    const scanned = await checkInStatus(ev, claims.i);
    const pass = buildApplePass(ev, claims, token, scanned ? serial(scanned.serial) : undefined);
    return new Response(new Uint8Array(pass), {
      headers: {
        "content-type": "application/vnd.apple.pkpass",
        "content-disposition": `attachment; filename="${ev.slug}.pkpass"`,
      },
    });
  } catch (e) {
    console.error("apple pass failed", e);
    return fail("Could not build the Apple Wallet pass. Check the pass certificate settings.", 500);
  }
}

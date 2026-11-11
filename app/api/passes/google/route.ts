import { NextResponse } from "next/server";
import { getEvent } from "@/lib/events";
import { fail } from "@/lib/http";
import { verifyTicket } from "@/lib/token";
import { googleSaveUrl, googleWalletReady } from "@/lib/wallet/google";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const claims = verifyTicket(token);
  const ev = claims && getEvent(claims.e);
  if (!claims || !ev) return fail("This ticket is not valid.", 404);
  if (!googleWalletReady()) return fail("Google Wallet is not set up yet: the issuer account is missing.", 501);
  try {
    return NextResponse.redirect(googleSaveUrl(ev, claims, token, url.origin));
  } catch (e) {
    console.error("google pass failed", e);
    return fail("Could not build the Google Wallet link. Check the service-account key.", 500);
  }
}

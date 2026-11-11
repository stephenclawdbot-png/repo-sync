import { NextResponse } from "next/server";
import { seedDemoMerchant } from "@/lib/demo";
import { fail } from "@/lib/http";

/** Creates a fresh demo merchant with a designed storefront and three events. */
export async function POST() {
  const res = await seedDemoMerchant();
  if ("error" in res) return fail(res.error, 500);
  return NextResponse.json({ mid: res.merchant.mid, key: res.key, handle: res.merchant.handle, name: res.merchant.name });
}

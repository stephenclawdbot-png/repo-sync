import { NextResponse } from "next/server";
import { seedDemoGuest } from "@/lib/demo";

/** Creates a fresh demo guest with upcoming tickets, a stub collection and points. */
export async function POST() {
  return NextResponse.json(await seedDemoGuest());
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/StorefrontView";
import { getMerchantByHandle, merchantEvents } from "@/lib/merchants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getMerchantByHandle((await params).handle);
  return m ? { title: m.name, description: m.storefront.tagline } : {};
}

export default async function StorefrontPage({ params }: Props) {
  const m = await getMerchantByHandle((await params).handle);
  if (!m) notFound();
  const events = (await merchantEvents(m.mid)).filter((e) => !e.past).map(({ doorCode: _d, ...e }) => e);
  return <StorefrontView merchant={m} events={events} />;
}

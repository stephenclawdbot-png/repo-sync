import { notFound } from "next/navigation";
import { DEMO_EVENT } from "@/lib/demo";
import { Storefront } from "@/components/Storefront";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== DEMO_EVENT.slug) notFound();
  return <Storefront event={DEMO_EVENT} />;
}

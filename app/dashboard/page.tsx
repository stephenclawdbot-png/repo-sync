import type { Metadata } from "next";
import { MerchantConsole } from "@/components/MerchantConsole";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Back office" };

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="wrap" style={{ paddingTop: 12 }}>
        <MerchantConsole />
      </main>
    </>
  );
}

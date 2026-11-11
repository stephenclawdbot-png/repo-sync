import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stagepass — ticketing with every payment method and next-day payouts",
  description:
    "Branded event storefronts, multi-gateway checkout (cards, GCash, Maya, QR, PayPal) and risk-based rolling payouts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

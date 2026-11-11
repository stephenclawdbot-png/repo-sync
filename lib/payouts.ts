/**
 * Risk-based rolling payouts — the alternative to "hold everything until after the event".
 */
export type RiskTier = "new" | "established" | "trusted";

export interface PayoutPolicy {
  tier: RiskTier;
  label: string;
  /** Business days after the sale that the non-reserved portion is paid out. 0 = instant on request. */
  settleDays: number;
  /** Fraction of each sale held back until event end + releaseDaysAfterEvent. */
  reserveRate: number;
  releaseDaysAfterEvent: number;
}

export const POLICIES: Record<RiskTier, PayoutPolicy> = {
  new: { tier: "new", label: "New organizer", settleDays: 2, reserveRate: 0.3, releaseDaysAfterEvent: 7 },
  established: { tier: "established", label: "Established", settleDays: 1, reserveRate: 0.12, releaseDaysAfterEvent: 5 },
  trusted: { tier: "trusted", label: "Trusted", settleDays: 0, reserveRate: 0.05, releaseDaysAfterEvent: 3 },
};

export interface RiskInputs {
  eventsCompleted: number;
  chargebackRate: number; // 0..1
  refundRate: number; // 0..1
  kycVerified: boolean;
  monthsActive: number;
}

export function riskTier(r: RiskInputs): RiskTier {
  if (!r.kycVerified || r.eventsCompleted < 3 || r.chargebackRate > 0.005) return "new";
  if (r.monthsActive >= 12 && r.chargebackRate < 0.002 && r.refundRate < 0.03) return "trusted";
  return "established";
}

export interface PayoutSplit {
  payNow: number;
  reserve: number;
  payNowDate: string;
  reserveReleaseDate: string;
}

function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let added = 0;
  while (added < n) {
    out.setUTCDate(out.getUTCDate() + 1);
    const day = out.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  return out;
}

export function splitSale(netMinor: number, policy: PayoutPolicy, saleDate: Date, eventEnd: Date): PayoutSplit {
  const reserve = Math.round(netMinor * policy.reserveRate);
  const release = new Date(eventEnd);
  release.setUTCDate(release.getUTCDate() + policy.releaseDaysAfterEvent);
  return {
    payNow: netMinor - reserve,
    reserve,
    payNowDate: addBusinessDays(saleDate, policy.settleDays).toISOString().slice(0, 10),
    reserveReleaseDate: release.toISOString().slice(0, 10),
  };
}

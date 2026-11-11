import { ALL_GATEWAYS } from "./gateways";
import type { GatewayId, Money, PaymentGateway, PaymentMethod } from "./types";

export interface OrganizerGatewayConfig {
  /** Gateways the organizer has enabled, in preference order. */
  enabled: GatewayId[];
  /** Connected (bring-your-own) accounts take priority: money settles directly to the organizer. */
  connectedAccounts?: Partial<Record<GatewayId, string>>;
}

export interface GatewayHealth {
  /** Rolling success rate over the last few minutes, 0..1. */
  successRate: number;
}

export interface RouteDecision {
  gateway: PaymentGateway;
  connectedAccount?: string;
  estimatedFee: number;
  reason: string;
  candidates: { id: GatewayId; fee: number; healthy: boolean; byo: boolean }[];
}

const MIN_HEALTHY_SUCCESS_RATE = 0.85;

/** The platform's default gateway. Others are only used for methods or markets it does not cover. */
export const DEFAULT_GATEWAY: GatewayId = "paymongo";

/**
 * Choose a gateway for a payment.
 *  1. Must support method + currency + country and be enabled by the organizer.
 *  2. Unhealthy gateways (success rate below threshold) are skipped unless nothing else works.
 *  3. A bring-your-own connected account wins (fastest payout, organizer's own contract).
 *  4. Otherwise the default gateway (PayMongo) takes the payment if it supports it.
 *  5. Failing that, the cheapest gateway wins.
 */
export function routePayment(
  method: PaymentMethod,
  amount: Money,
  country: string,
  config: OrganizerGatewayConfig,
  health: Partial<Record<GatewayId, GatewayHealth>> = {},
): RouteDecision {
  const candidates = ALL_GATEWAYS.filter(
    (g) => config.enabled.includes(g.id) && g.supports(method, amount.currency, country),
  ).map((g) => ({
    gateway: g,
    fee: g.fee(method, amount),
    healthy: (health[g.id]?.successRate ?? 1) >= MIN_HEALTHY_SUCCESS_RATE,
    byo: Boolean(config.connectedAccounts?.[g.id]),
  }));

  if (candidates.length === 0) {
    throw new Error(`No enabled gateway supports ${method} in ${amount.currency}/${country}`);
  }

  const pool = candidates.some((c) => c.healthy) ? candidates.filter((c) => c.healthy) : candidates;
  const isDefault = (c: (typeof pool)[number]) => Number(c.gateway.id === DEFAULT_GATEWAY);
  pool.sort((a, b) => Number(b.byo) - Number(a.byo) || isDefault(b) - isDefault(a) || a.fee - b.fee);
  const pick = pool[0];

  const skipped = candidates.filter((c) => !c.healthy).map((c) => c.gateway.displayName);
  const reason = [
    pick.byo ? "organizer's own connected account" : pick.gateway.id === DEFAULT_GATEWAY ? "default gateway" : "lowest processing cost",
    skipped.length ? `failover: skipped ${skipped.join(", ")} (degraded)` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    gateway: pick.gateway,
    connectedAccount: config.connectedAccounts?.[pick.gateway.id],
    estimatedFee: pick.fee,
    reason,
    candidates: candidates.map((c) => ({ id: c.gateway.id, fee: c.fee, healthy: c.healthy, byo: c.byo })),
  };
}

/** Payment methods to show first, by buyer country. */
export const LOCAL_METHODS: Record<string, PaymentMethod[]> = {
  PH: ["gcash", "maya", "qrph", "card", "grabpay", "paypal"],
  SG: ["paynow", "card", "apple_pay", "grabpay", "paypal"],
  MY: ["duitnow", "card", "grabpay", "paypal"],
  TH: ["promptpay", "card", "paypal"],
  ID: ["qris", "card", "paypal"],
  US: ["card", "apple_pay", "google_pay", "paypal"],
};

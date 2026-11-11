export type GatewayId = "stripe" | "paymongo" | "xendit" | "paypal";

export type PaymentMethod =
  | "card"
  | "gcash"
  | "maya"
  | "qrph"
  | "grabpay"
  | "paynow"
  | "promptpay"
  | "duitnow"
  | "qris"
  | "paypal"
  | "apple_pay"
  | "google_pay";

export interface Money {
  /** Integer minor units (centavos, cents). Never use floats for money. */
  amount: number;
  currency: string;
}

export interface CreateIntentInput {
  orderId: string;
  idempotencyKey: string;
  amount: Money;
  method: PaymentMethod;
  country: string;
  /** Organizer's connected account on this gateway, if they brought their own. */
  connectedAccount?: string;
  /** Platform fee taken via application fee / split. */
  platformFee: Money;
  returnUrl: string;
}

export type NextAction =
  | { type: "client_secret"; value: string }
  | { type: "redirect"; url: string }
  | { type: "qr"; payload: string };

export interface Intent {
  gateway: GatewayId;
  providerRef: string;
  status: "requires_action" | "processing" | "succeeded" | "failed";
  nextAction: NextAction;
  /** Estimated gateway cost, in minor units, used for routing decisions. */
  estimatedFee: number;
}

export interface NormalizedEvent {
  id: string;
  type: "payment.succeeded" | "payment.failed" | "refund.succeeded" | "dispute.opened";
  providerRef: string;
  orderId: string;
  amount: Money;
}

export interface FeeSchedule {
  percentBps: number; // basis points, 250 = 2.5 %
  fixedMinor: number;
}

export interface PaymentGateway {
  id: GatewayId;
  displayName: string;
  supports(method: PaymentMethod, currency: string, country: string): boolean;
  fee(method: PaymentMethod, amount: Money): number;
  createIntent(input: CreateIntentInput): Promise<Intent>;
  refund(providerRef: string, amount: Money): Promise<{ id: string; status: string }>;
  parseWebhook(rawBody: string, headers: Headers): Promise<NormalizedEvent>;
}

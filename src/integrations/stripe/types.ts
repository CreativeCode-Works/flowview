// Stripe API response types
// All amounts are in smallest currency unit (cents for USD).
// All timestamps are Unix epoch seconds (not milliseconds).

export interface StripeList<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  url: string;
}

export interface StripeProduct {
  id: string;
  object: "product";
  active: boolean;
  created: number;
  name: string;
  description: string | null;
  default_price: string | StripePrice | null;
  metadata: Record<string, string>;
  livemode: boolean;
  images: string[];
  url: string | null;
}

export interface StripePrice {
  id: string;
  object: "price";
  active: boolean;
  currency: string;
  product: string | StripeProduct;
  type: "one_time" | "recurring";
  unit_amount: number | null;
  recurring: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
    trial_period_days: number | null;
  } | null;
  metadata: Record<string, string>;
  created: number;
  livemode: boolean;
}

export interface StripeCustomer {
  id: string;
  object: "customer";
  email: string | null;
  name: string | null;
  phone: string | null;
  created: number;
  currency: string | null;
  delinquent: boolean | null;
  description: string | null;
  metadata: Record<string, string>;
  livemode: boolean;
}

export type StripeSubscriptionStatus =
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "paused";

export interface StripeSubscription {
  id: string;
  object: "subscription";
  customer: string | StripeCustomer;
  status: StripeSubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at: number | null;
  created: number;
  currency: string;
  items: StripeList<StripeSubscriptionItem>;
  metadata: Record<string, string>;
  livemode: boolean;
  trial_end: number | null;
  trial_start: number | null;
  ended_at: number | null;
}

export interface StripeSubscriptionItem {
  id: string;
  object: "subscription_item";
  price: StripePrice;
  quantity: number;
  created: number;
  subscription: string;
  metadata: Record<string, string>;
}

export type StripeChargeStatus = "succeeded" | "pending" | "failed";

export interface StripeCharge {
  id: string;
  object: "charge";
  amount: number;
  amount_refunded: number;
  currency: string;
  customer: string | StripeCustomer | null;
  description: string | null;
  failure_code: string | null;
  failure_message: string | null;
  invoice: string | null;
  metadata: Record<string, string>;
  paid: boolean;
  payment_intent: string | null;
  refunded: boolean;
  status: StripeChargeStatus;
  created: number;
  livemode: boolean;
}

export type StripeInvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void";

export interface StripeInvoice {
  id: string;
  object: "invoice";
  customer: string | StripeCustomer | null;
  customer_email: string | null;
  customer_name: string | null;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  status: StripeInvoiceStatus | null;
  subscription: string | null;
  created: number;
  due_date: number | null;
  paid: boolean;
  number: string | null;
  metadata: Record<string, string>;
  livemode: boolean;
}

export interface StripeWebhookEndpoint {
  id: string;
  object: "webhook_endpoint";
  url: string;
  enabled_events: string[];
  status: "enabled" | "disabled";
  description: string | null;
  created: number;
  livemode: boolean;
  metadata: Record<string, string>;
  api_version: string | null;
}

export interface StripeEvent {
  id: string;
  object: "event";
  type: string; // e.g. "charge.succeeded", "invoice.paid"
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  } | null;
}

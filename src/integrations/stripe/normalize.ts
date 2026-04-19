import type {
  StripeProduct,
  StripePrice,
  StripeWebhookEndpoint,
  StripeCustomer,
  StripeCharge,
  StripeSubscription,
  StripeInvoice,
  StripeEvent,
} from "./types";
import type { FlowNode, Contact, Event } from "@/types/unified";

// Helper: Unix seconds → ISO string
function unixToIso(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

// Helper: format cents to dollar string
function centsToDollars(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

// ---- Config normalization (→ FlowNode) ----

export function normalizeProduct(
  p: StripeProduct,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "stripe",
    platformId: p.id,
    nodeType: "product",
    name: p.name,
    status: p.active ? "active" : "inactive",
    config: {
      description: p.description,
      images: p.images,
      defaultPriceId:
        typeof p.default_price === "string"
          ? p.default_price
          : p.default_price?.id ?? null,
    },
    createdAt: unixToIso(p.created),
    updatedAt: unixToIso(p.created),
  };
}

export function normalizePrice(
  p: StripePrice,
  accountId: string
): FlowNode {
  const productId =
    typeof p.product === "string" ? p.product : p.product?.id ?? "unknown";

  return {
    id: "",
    accountId,
    platform: "stripe",
    platformId: p.id,
    nodeType: "price",
    name: p.unit_amount
      ? `${centsToDollars(p.unit_amount, p.currency)}${p.recurring ? `/${p.recurring.interval}` : ""}`
      : `Price ${p.id}`,
    status: p.active ? "active" : "inactive",
    config: {
      productId,
      type: p.type,
      unitAmount: p.unit_amount,
      currency: p.currency,
      recurring: p.recurring,
    },
    createdAt: unixToIso(p.created),
    updatedAt: unixToIso(p.created),
  };
}

export function normalizeWebhookEndpoint(
  w: StripeWebhookEndpoint,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "stripe",
    platformId: w.id,
    nodeType: "webhook",
    name: w.description ?? w.url,
    status: w.status === "enabled" ? "active" : "inactive",
    config: {
      url: w.url,
      enabledEvents: w.enabled_events,
      apiVersion: w.api_version,
    },
    createdAt: unixToIso(w.created),
    updatedAt: unixToIso(w.created),
  };
}

// ---- Contact normalization ----

export function normalizeCustomerToContact(
  c: StripeCustomer,
  accountId: string
): Contact {
  return {
    id: "",
    accountId,
    email: c.email,
    name: c.name,
    phone: c.phone,
    platformIds: { stripe: c.id },
    tags: [],
    firstSeenAt: unixToIso(c.created),
    lastSeenAt: unixToIso(c.created),
    createdAt: unixToIso(c.created),
    updatedAt: unixToIso(c.created),
  };
}

// ---- Event normalization ----

export function normalizeChargeToEvent(
  c: StripeCharge,
  accountId: string
): Event | null {
  const customerId =
    typeof c.customer === "string"
      ? c.customer
      : c.customer?.id ?? null;

  if (!customerId) return null;

  const eventType =
    c.status === "succeeded"
      ? "charge_succeeded"
      : c.status === "failed"
        ? "charge_failed"
        : "charge_succeeded";

  return {
    id: "",
    accountId,
    contactId: "", // resolved by customer email during DB insert
    platform: "stripe",
    eventType,
    timestamp: unixToIso(c.created),
    sourceNodeId: null,
    metadata: {
      chargeId: c.id,
      stripeCustomerId: customerId,
      amount: c.amount,
      currency: c.currency,
      description: c.description,
      invoiceId: c.invoice,
      refunded: c.refunded,
      failureCode: c.failure_code,
      failureMessage: c.failure_message,
    },
    createdAt: unixToIso(c.created),
  };
}

export function normalizeSubscriptionToEvent(
  s: StripeSubscription,
  accountId: string
): Event {
  const customerId =
    typeof s.customer === "string" ? s.customer : s.customer?.id ?? "";

  const eventTypeMap: Record<string, string> = {
    active: "subscription_created",
    past_due: "subscription_updated",
    unpaid: "subscription_updated",
    canceled: "subscription_canceled",
    incomplete: "subscription_created",
    incomplete_expired: "subscription_canceled",
    trialing: "subscription_created",
    paused: "subscription_updated",
  };

  return {
    id: "",
    accountId,
    contactId: "",
    platform: "stripe",
    eventType: eventTypeMap[s.status] ?? "subscription_updated",
    timestamp: unixToIso(s.created),
    sourceNodeId: null,
    metadata: {
      subscriptionId: s.id,
      stripeCustomerId: customerId,
      status: s.status,
      currency: s.currency,
      currentPeriodStart: unixToIso(s.current_period_start),
      currentPeriodEnd: unixToIso(s.current_period_end),
      cancelAtPeriodEnd: s.cancel_at_period_end,
      trialEnd: s.trial_end ? unixToIso(s.trial_end) : null,
    },
    createdAt: unixToIso(s.created),
  };
}

export function normalizeInvoiceToEvent(
  i: StripeInvoice,
  accountId: string
): Event | null {
  const customerId =
    typeof i.customer === "string" ? i.customer : i.customer?.id ?? null;

  if (!customerId) return null;

  const eventType = i.paid ? "invoice_paid" : "invoice_payment_failed";

  return {
    id: "",
    accountId,
    contactId: "",
    platform: "stripe",
    eventType,
    timestamp: unixToIso(i.created),
    sourceNodeId: null,
    metadata: {
      invoiceId: i.id,
      stripeCustomerId: customerId,
      amountDue: i.amount_due,
      amountPaid: i.amount_paid,
      currency: i.currency,
      status: i.status,
      subscriptionId: i.subscription,
      number: i.number,
    },
    createdAt: unixToIso(i.created),
  };
}

// Map Stripe event types to our unified event types
const STRIPE_EVENT_TYPE_MAP: Record<string, string> = {
  "charge.succeeded": "charge_succeeded",
  "charge.failed": "charge_failed",
  "customer.created": "customer_created",
  "customer.subscription.created": "subscription_created",
  "customer.subscription.updated": "subscription_updated",
  "customer.subscription.deleted": "subscription_canceled",
  "invoice.paid": "invoice_paid",
  "invoice.payment_failed": "invoice_payment_failed",
  "checkout.session.completed": "checkout_completed",
};

export function normalizeStripeEvent(
  e: StripeEvent,
  accountId: string
): Event | null {
  const eventType = STRIPE_EVENT_TYPE_MAP[e.type];
  if (!eventType) return null;

  const obj = e.data.object;
  const customerId =
    (obj.customer as string) ?? (obj.id as string) ?? null;

  return {
    id: "",
    accountId,
    contactId: "",
    platform: "stripe",
    eventType,
    timestamp: unixToIso(e.created),
    sourceNodeId: null,
    metadata: {
      stripeEventId: e.id,
      stripeEventType: e.type,
      stripeCustomerId: customerId,
      objectId: obj.id as string,
    },
    createdAt: unixToIso(e.created),
  };
}

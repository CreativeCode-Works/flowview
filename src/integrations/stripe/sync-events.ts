import { StripeClient } from "./client";
import {
  normalizeCustomerToContact,
  normalizeChargeToEvent,
  normalizeSubscriptionToEvent,
  normalizeInvoiceToEvent,
  normalizeStripeEvent,
} from "./normalize";
import type { Contact, Event } from "@/types/unified";

interface SyncEventsResult {
  contacts: Contact[];
  events: Event[];
  errors: Array<{ operation: string; message: string }>;
}

export async function syncEvents(
  client: StripeClient,
  accountId: string
): Promise<SyncEventsResult> {
  const contacts: Contact[] = [];
  const events: Event[] = [];
  const errors: Array<{ operation: string; message: string }> = [];

  // 30 days ago (Stripe events API limit)
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

  // Fetch in parallel
  const [customers, charges, subscriptions, invoices, stripeEvents] =
    await Promise.allSettled([
      client.getCustomers(),
      client.getCharges(since),
      client.getSubscriptions(),
      client.getInvoices(since),
      client.getEvents(since),
    ]);

  if (customers.status === "fulfilled") {
    for (const c of customers.value) {
      contacts.push(normalizeCustomerToContact(c, accountId));
    }
  } else {
    errors.push({
      operation: "getCustomers",
      message: customers.reason?.message ?? "Unknown error",
    });
  }

  if (charges.status === "fulfilled") {
    for (const c of charges.value) {
      const event = normalizeChargeToEvent(c, accountId);
      if (event) events.push(event);
    }
  } else {
    errors.push({
      operation: "getCharges",
      message: charges.reason?.message ?? "Unknown error",
    });
  }

  if (subscriptions.status === "fulfilled") {
    for (const s of subscriptions.value) {
      events.push(normalizeSubscriptionToEvent(s, accountId));
    }
  } else {
    errors.push({
      operation: "getSubscriptions",
      message: subscriptions.reason?.message ?? "Unknown error",
    });
  }

  if (invoices.status === "fulfilled") {
    for (const i of invoices.value) {
      const event = normalizeInvoiceToEvent(i, accountId);
      if (event) events.push(event);
    }
  } else {
    errors.push({
      operation: "getInvoices",
      message: invoices.reason?.message ?? "Unknown error",
    });
  }

  if (stripeEvents.status === "fulfilled") {
    for (const e of stripeEvents.value) {
      const event = normalizeStripeEvent(e, accountId);
      if (event) events.push(event);
    }
  } else {
    errors.push({
      operation: "getEvents",
      message: stripeEvents.reason?.message ?? "Unknown error",
    });
  }

  return { contacts, events, errors };
}

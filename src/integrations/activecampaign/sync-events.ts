import { ActiveCampaignClient } from "./client";
import { normalizeContact, normalizeContactAutomationEvents, normalizeActivity } from "./normalize";
import type { Contact, Event } from "@/types/unified";

interface SyncEventsResult {
  contacts: Contact[];
  events: Event[];
  errors: Array<{ operation: string; contactId: string; message: string }>;
}

export async function syncEvents(
  client: ActiveCampaignClient,
  accountId: string
): Promise<SyncEventsResult> {
  const contacts: Contact[] = [];
  const events: Event[] = [];
  const errors: Array<{ operation: string; contactId: string; message: string }> = [];

  // 90 days ago
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceIso = since.toISOString();

  // Fetch all contacts
  const acContacts = await client.getContacts();

  for (const acContact of acContacts) {
    contacts.push(normalizeContact(acContact, accountId));

    // Fetch contact-level event data
    try {
      const automations = await client.getContactAutomations(acContact.id);
      const automationEvents = normalizeContactAutomationEvents(
        automations,
        acContact.id,
        accountId
      );
      events.push(...automationEvents);
    } catch (err) {
      errors.push({
        operation: "getContactAutomations",
        contactId: acContact.id,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

    try {
      const activities = await client.getContactActivities(
        acContact.id,
        sinceIso
      );
      for (const activity of activities) {
        const event = normalizeActivity(activity, acContact.id, accountId);
        if (event) events.push(event);
      }
    } catch (err) {
      errors.push({
        operation: "getContactActivities",
        contactId: acContact.id,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { contacts, events, errors };
}

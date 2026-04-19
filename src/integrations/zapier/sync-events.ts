import { ZapierClient } from "./client";
import type { Event } from "@/types/unified";

interface SyncEventsResult {
  contacts: never[]; // Zapier doesn't have contacts
  events: Event[];
  errors: Array<{ operation: string; message: string }>;
}

// Zapier's run history API is not publicly available.
// We extract what we can from Zap metadata (last_successful_run_date)
// and surface the lack of run history as an audit finding.
export async function syncEvents(
  client: ZapierClient,
  accountId: string
): Promise<SyncEventsResult> {
  const events: Event[] = [];
  const errors: Array<{ operation: string; message: string }> = [];

  try {
    const zaps = await client.getZaps();

    for (const zap of zaps) {
      // Use last_successful_run_date as a lightweight proxy event
      if (zap.last_successful_run_date) {
        events.push({
          id: "",
          accountId,
          contactId: "", // Zapier events aren't contact-scoped
          platform: "zapier",
          eventType: "zap_run_completed",
          timestamp: zap.last_successful_run_date,
          sourceNodeId: null,
          metadata: {
            zapId: zap.id,
            zapTitle: zap.title,
            isEnabled: zap.is_enabled,
          },
          createdAt: zap.last_successful_run_date,
        });
      }

      // Track zap state changes
      if (zap.updated_at) {
        events.push({
          id: "",
          accountId,
          contactId: "",
          platform: "zapier",
          eventType: zap.is_enabled ? "zap_turned_on" : "zap_turned_off",
          timestamp: zap.updated_at,
          sourceNodeId: null,
          metadata: {
            zapId: zap.id,
            zapTitle: zap.title,
          },
          createdAt: zap.updated_at,
        });
      }
    }
  } catch (err) {
    errors.push({
      operation: "syncEvents",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }

  return { contacts: [], events, errors };
}

"use client";

import { useEffect, useState } from "react";

interface TimelineEvent {
  id: string;
  platform: string;
  event_type: string;
  timestamp: string;
  source_node_id: string | null;
  metadata: Record<string, unknown>;
}

interface FlowNodeRef {
  id: string;
  name: string;
  platform: string;
  node_type: string;
  status: string | null;
}

interface Contact {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  platform_ids: Record<string, string | null>;
  tags: string[];
  first_seen_at: string | null;
  last_seen_at: string | null;
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
  const zapName = metadata.zapName ? String(metadata.zapName) : null;
  const amount = metadata.amount ? Number(metadata.amount) : null;
  const currency = metadata.currency ? String(metadata.currency).toUpperCase() : "";
  const description = metadata.description ? String(metadata.description) : null;

  return (
    <div className="mt-2 space-y-0.5">
      {zapName && (
        <p className="text-xs text-zinc-500">Zap: {zapName}</p>
      )}
      {amount !== null && (
        <p className="text-xs text-zinc-500">
          Amount: {(amount / 100).toFixed(2)} {currency}
        </p>
      )}
      {description && (
        <p className="text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  activecampaign: "border-blue-500",
  zapier: "border-orange-500",
  stripe: "border-purple-500",
};

const PLATFORM_BG: Record<string, string> = {
  activecampaign: "bg-blue-500",
  zapier: "bg-orange-500",
  stripe: "bg-purple-500",
};

const PLATFORM_LABELS: Record<string, string> = {
  activecampaign: "ActiveCampaign",
  zapier: "Zapier",
  stripe: "Stripe",
};

const EVENT_LABELS: Record<string, string> = {
  automation_entered: "Entered automation",
  automation_completed: "Completed automation",
  automation_skipped: "Skipped automation",
  email_sent: "Email sent",
  email_opened: "Email opened",
  email_clicked: "Email clicked",
  email_bounced: "Email bounced",
  tag_added: "Tag added",
  tag_removed: "Tag removed",
  contact_created: "Contact created",
  contact_updated: "Contact updated",
  deal_created: "Deal created",
  deal_won: "Deal won",
  deal_lost: "Deal lost",
  zap_run_completed: "Zap completed",
  zap_turned_on: "Zap turned on",
  zap_turned_off: "Zap turned off",
  charge_succeeded: "Payment succeeded",
  charge_failed: "Payment failed",
  subscription_created: "Subscription started",
  subscription_updated: "Subscription updated",
  subscription_canceled: "Subscription canceled",
  invoice_paid: "Invoice paid",
  invoice_payment_failed: "Invoice payment failed",
  customer_created: "Customer created",
  checkout_completed: "Checkout completed",
  webhook_received: "Webhook received",
  webhook_failed: "Webhook failed",
};

export function ContactTimeline({
  contact,
  accountId,
}: {
  contact: Contact;
  accountId: string;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [nodes, setNodes] = useState<FlowNodeRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await fetch(
        `/api/replay/timeline?contactId=${contact.id}&accountId=${accountId}`
      );
      const data = await res.json();
      setEvents(data.events ?? []);
      setNodes(data.nodes ?? []);
      setIsLoading(false);
    }
    load();
  }, [contact.id, accountId]);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const platforms = Object.entries(contact.platform_ids)
    .filter(([, id]) => id)
    .map(([p]) => p);

  return (
    <div>
      {/* Contact header */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {contact.name ?? contact.email ?? "Unknown Contact"}
            </h2>
            {contact.name && contact.email && (
              <p className="text-sm text-zinc-400">{contact.email}</p>
            )}
            {contact.phone && (
              <p className="text-xs text-zinc-500">{contact.phone}</p>
            )}
          </div>
          <div className="flex gap-2">
            {platforms.map((p) => (
              <span
                key={p}
                className={`rounded-full px-2.5 py-1 text-xs font-medium text-white ${PLATFORM_BG[p] ?? "bg-zinc-600"}`}
              >
                {PLATFORM_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-xs text-zinc-500">
          {contact.first_seen_at && (
            <span>
              First seen:{" "}
              {new Date(contact.first_seen_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {contact.last_seen_at && (
            <span>
              Last seen:{" "}
              {new Date(contact.last_seen_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          <span>{events.length} events</span>
        </div>

        {contact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-zinc-400">Loading timeline...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">
            No events found for this contact.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="space-y-0">
            {events.map((event, index) => {
              const node = event.source_node_id
                ? nodeMap.get(event.source_node_id)
                : null;
              const color = PLATFORM_COLORS[event.platform] ?? "border-zinc-500";
              const showDate =
                index === 0 ||
                new Date(event.timestamp).toDateString() !==
                  new Date(events[index - 1].timestamp).toDateString();

              return (
                <div key={event.id}>
                  {showDate && (
                    <div className="relative mb-2 mt-4 flex items-center pl-10">
                      <span className="text-xs font-medium text-zinc-500">
                        {new Date(event.timestamp).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  )}
                  <div className="relative flex items-start py-2 pl-10">
                    {/* Dot */}
                    <div
                      className={`absolute left-[11px] top-[14px] h-2.5 w-2.5 rounded-full border-2 bg-zinc-950 ${color}`}
                    />

                    {/* Content */}
                    <div className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">
                          {EVENT_LABELS[event.event_type] ?? event.event_type}
                        </p>
                        <span className="text-xs text-zinc-500">
                          {new Date(event.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          {PLATFORM_LABELS[event.platform] ?? event.platform}
                        </span>
                        {node && (
                          <>
                            <span className="text-xs text-zinc-600">·</span>
                            <span className="text-xs text-zinc-400">
                              {node.name}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Show relevant metadata */}
                      {event.metadata &&
                        Object.keys(event.metadata).length > 0 && (
                          <MetadataDisplay metadata={event.metadata} />
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

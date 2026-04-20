import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Platform, FlowNode, Contact, Event } from "@/types/unified";

// Vercel Pro: extend function timeout to 60 seconds
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get account
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  // Get body — optional platform filter
  const body = await request.json().catch(() => ({}));
  const platformFilter = body.platform as Platform | undefined;

  // Get active connections
  let connectionsQuery = supabase
    .from("connections")
    .select("*")
    .eq("account_id", account.id)
    .eq("status", "active");

  if (platformFilter) {
    connectionsQuery = connectionsQuery.eq("platform", platformFilter);
  }

  const { data: connections } = await connectionsQuery;

  if (!connections || connections.length === 0) {
    return NextResponse.json({
      error: "No active connections found",
    }, { status: 404 });
  }

  const results: Record<
    string,
    {
      nodes: number;
      contacts: number;
      events: number;
      errors: string[];
    }
  > = {};

  for (const connection of connections) {
    const platform = connection.platform as Platform;

    try {
      // Run platform-specific sync (config only for speed — events in background later)
      const { configResult, eventsResult } = await runPlatformSync(
        platform,
        connection,
        account.id
      );

      // Upsert flow nodes
      if (configResult.nodes.length > 0) {
        await upsertNodes(supabase, configResult.nodes);
      }

      // Upsert contacts (from events sync — lightweight list only)
      if (eventsResult.contacts.length > 0) {
        await upsertContacts(supabase, eventsResult.contacts);
      }

      // Skip bulk event insert for now to stay under Vercel timeout
      // Events will be synced via background jobs (Trigger.dev) later

      // Update last synced
      await supabase
        .from("connections")
        .update({
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);

      results[platform] = {
        nodes: configResult.nodes.length,
        contacts: eventsResult.contacts?.length ?? 0,
        events: eventsResult.events.length,
        errors: [
          ...configResult.errors.map(
            (e: { operation: string; message: string }) =>
              `${e.operation}: ${e.message}`
          ),
          ...(eventsResult.errors ?? []).map(
            (e: { operation: string; message: string }) =>
              `${e.operation}: ${e.message}`
          ),
        ],
      };
    } catch (err) {
      console.error(`Sync error for ${platform}:`, err);
      results[platform] = {
        nodes: 0,
        contacts: 0,
        events: 0,
        errors: [err instanceof Error ? err.message : "Unknown error"],
      };
    }
  }

  return NextResponse.json({ success: true, results });
}

interface SyncOutput {
  configResult: { nodes: FlowNode[]; errors: Array<{ operation: string; message: string }> };
  eventsResult: {
    contacts: Contact[];
    events: Event[];
    errors: Array<{ operation: string; message: string }>;
  };
}

// Fetch credentials from Nango for a connection
async function getNangoCredentials(
  nangoConnectionId: string,
  integrationId: string
): Promise<{ apiKey?: string; hostname?: string }> {
  const res = await fetch(
    `https://api.nango.dev/connection/${nangoConnectionId}?provider_config_key=${integrationId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nango credential fetch failed: ${body}`);
  }

  const data = await res.json();

  return {
    apiKey: data.credentials?.apiKey,
    hostname: data.connection_config?.hostname,
  };
}

async function runPlatformSync(
  platform: Platform,
  connection: Record<string, unknown>,
  accountId: string
): Promise<SyncOutput> {
  const nangoConnectionId = connection.nango_connection_id as string;

  switch (platform) {
    case "activecampaign": {
      const creds = await getNangoCredentials(nangoConnectionId, "active-campaign");
      const { ActiveCampaignClient } = await import("@/integrations/activecampaign/client");
      const { syncConfig } = await import("@/integrations/activecampaign/sync-config");
      const client = new ActiveCampaignClient({
        baseUrl: `https://${creds.hostname}`,
        apiToken: creds.apiKey ?? "",
      });
      // Config sync only (automations, tags, lists, etc.) — fast
      const configResult = await syncConfig(client, accountId);
      // Get contact list without per-contact event history — much faster
      const contacts = await client.getContacts();
      const { normalizeContact } = await import("@/integrations/activecampaign/normalize");
      const normalizedContacts = contacts.map((c) => normalizeContact(c, accountId));
      return {
        configResult,
        eventsResult: { contacts: normalizedContacts, events: [], errors: [] },
      };
    }
    case "zapier": {
      return {
        configResult: { nodes: [], errors: [] },
        eventsResult: { contacts: [], events: [], errors: [] },
      };
    }
    case "stripe": {
      const creds = await getNangoCredentials(nangoConnectionId, "stripe-api-key");
      const { StripeClient } = await import("@/integrations/stripe/client");
      const { syncConfig } = await import("@/integrations/stripe/sync-config");
      const client = new StripeClient({ secretKey: creds.apiKey ?? "" });
      // Config sync only — fast
      const configResult = await syncConfig(client, accountId);
      // Get customers without full event history
      const customers = await client.getCustomers();
      const { normalizeCustomerToContact } = await import("@/integrations/stripe/normalize");
      const normalizedContacts = customers.map((c) => normalizeCustomerToContact(c, accountId));
      return {
        configResult,
        eventsResult: { contacts: normalizedContacts, events: [], errors: [] },
      };
    }
  }
}

// DB helpers

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function upsertNodes(supabase: SupabaseClient, nodes: FlowNode[]) {
  const rows = nodes.map((n) => ({
    account_id: n.accountId,
    platform: n.platform,
    platform_id: n.platformId,
    node_type: n.nodeType,
    name: n.name,
    status: n.status,
    config: n.config,
    updated_at: new Date().toISOString(),
  }));

  // Batch upsert in chunks of 100
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await supabase
      .from("flow_nodes")
      .upsert(chunk, {
        onConflict: "account_id,platform,platform_id",
      });
  }
}

async function upsertContacts(supabase: SupabaseClient, contacts: Contact[]) {
  for (const contact of contacts) {
    if (!contact.email) continue;

    // Check if contact exists by email + account
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, platform_ids")
      .eq("account_id", contact.accountId)
      .eq("email", contact.email)
      .single();

    if (existing) {
      // Merge platform IDs — never overwrite, only add
      const mergedPlatformIds = {
        ...(existing.platform_ids as Record<string, string>),
        ...contact.platformIds,
      };

      await supabase
        .from("contacts")
        .update({
          name: contact.name ?? undefined,
          phone: contact.phone ?? undefined,
          platform_ids: mergedPlatformIds,
          last_seen_at: contact.lastSeenAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("contacts").insert({
        account_id: contact.accountId,
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
        platform_ids: contact.platformIds,
        first_seen_at: contact.firstSeenAt,
        last_seen_at: contact.lastSeenAt,
      });
    }
  }
}

async function insertEvents(
  supabase: SupabaseClient,
  events: Event[],
  accountId: string
) {
  const rows = events.map((e) => ({
    account_id: accountId,
    contact_id: e.contactId || null,
    platform: e.platform,
    event_type: e.eventType,
    timestamp: e.timestamp,
    source_node_id: e.sourceNodeId,
    metadata: e.metadata,
  }));

  // Filter out events without valid timestamps
  const validRows = rows.filter((r) => r.timestamp && !isNaN(Date.parse(r.timestamp)));

  // Batch insert in chunks of 500
  for (let i = 0; i < validRows.length; i += 500) {
    const chunk = validRows.slice(i, i + 500);
    await supabase.from("events").insert(chunk);
  }
}

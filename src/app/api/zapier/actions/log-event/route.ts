import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Zapier sends data here when a Zap runs.
// Users add this as an action step: "Log Event to FlowView"
// This captures the zap run data including contact info.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const apiKey =
    request.headers.get("X-API-Key") ??
    request.headers.get("X-API-KEY") ??
    url.searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (!account) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const {
    email,
    event_type,
    zap_name,
    zap_id,
    description,
    metadata,
  } = body;

  // Find or create contact by email
  let contactId: string | null = null;
  if (email) {
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("account_id", account.id)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          account_id: account.id,
          email: email.toLowerCase().trim(),
          platform_ids: { zapier: zap_id ?? null },
        })
        .select("id")
        .single();
      contactId = newContact?.id ?? null;
    }
  }

  // Insert the event
  const { error } = await supabase.from("events").insert({
    account_id: account.id,
    contact_id: contactId,
    platform: "zapier",
    event_type: event_type ?? "zap_run_completed",
    timestamp: new Date().toISOString(),
    source_node_id: null,
    metadata: {
      zapName: zap_name,
      zapId: zap_id,
      description,
      source: "zapier-integration",
      ...(metadata ?? {}),
    },
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    contact_id: contactId,
    message: "Event logged successfully",
  });
}

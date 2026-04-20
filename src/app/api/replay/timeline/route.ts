import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const contactId = url.searchParams.get("contactId");
  const accountId = url.searchParams.get("accountId");

  if (!contactId || !accountId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Verify ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("owner_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get contact details
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .single();

  // Get all events for this contact, ordered by time
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("contact_id", contactId)
    .eq("account_id", accountId)
    .order("timestamp", { ascending: true });

  // Get flow nodes referenced by events
  const nodeIds = [
    ...new Set(
      (events ?? [])
        .map((e: Record<string, unknown>) => e.source_node_id)
        .filter(Boolean)
    ),
  ];

  let nodes: Record<string, unknown>[] = [];
  if (nodeIds.length > 0) {
    const { data } = await supabase
      .from("flow_nodes")
      .select("id, name, platform, node_type, status")
      .in("id", nodeIds);
    nodes = data ?? [];
  }

  return NextResponse.json({
    contact,
    events: events ?? [],
    nodes,
  });
}

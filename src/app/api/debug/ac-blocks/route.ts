import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Platform } from "@/types/unified";

/**
 * Debug endpoint: fetch raw automation blocks from AC to inspect structure.
 * GET /api/debug/ac-blocks?automationId=123
 * Returns raw block data for analysis.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const automationId = searchParams.get("automationId");

  // Get account + AC connection
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!account) {
    return NextResponse.json({ error: "No account" }, { status: 404 });
  }

  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("account_id", account.id)
    .eq("platform", "activecampaign" satisfies Platform)
    .eq("status", "active")
    .single();

  if (!connection) {
    return NextResponse.json(
      { error: "No active AC connection" },
      { status: 404 }
    );
  }

  // Get Nango credentials
  const nangoRes = await fetch(
    `https://api.nango.dev/connection/${connection.nango_connection_id}?provider_config_key=active-campaign`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
      },
    }
  );

  if (!nangoRes.ok) {
    return NextResponse.json(
      { error: "Failed to get credentials" },
      { status: 500 }
    );
  }

  const nangoData = await nangoRes.json();
  const apiKey =
    nangoData.credentials?.apiKey ?? nangoData.credentials?.api_key;
  const hostname = nangoData.connection_config?.hostname;

  if (!apiKey || !hostname) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 500 }
    );
  }

  const baseUrl = `https://${hostname}`;

  // If automationId specified, fetch blocks for that one
  // Otherwise, fetch first 3 automations and their blocks
  if (automationId) {
    const blocksRes = await fetch(
      `${baseUrl}/api/3/automations/${automationId}/blocks`,
      { headers: { "Api-Token": apiKey } }
    );

    if (!blocksRes.ok) {
      const body = await blocksRes.text();
      return NextResponse.json({
        error: `Blocks endpoint returned ${blocksRes.status}`,
        body: body.slice(0, 2000),
      });
    }

    const blocksData = await blocksRes.json();
    return NextResponse.json({
      automationId,
      raw: blocksData,
      keys: Object.keys(blocksData),
    });
  }

  // Fetch first 3 automations
  const autoRes = await fetch(
    `${baseUrl}/api/3/automations?limit=3&offset=0`,
    { headers: { "Api-Token": apiKey } }
  );

  if (!autoRes.ok) {
    return NextResponse.json({ error: "Failed to fetch automations" });
  }

  const autoData = await autoRes.json();
  const automations = autoData.automations ?? [];

  const results = [];
  for (const auto of automations.slice(0, 3)) {
    const blocksRes = await fetch(
      `${baseUrl}/api/3/automations/${auto.id}/blocks`,
      { headers: { "Api-Token": apiKey } }
    );

    let blocks: unknown = null;
    let blockKeys: string[] = [];

    if (blocksRes.ok) {
      blocks = await blocksRes.json();
      blockKeys = Object.keys(blocks as Record<string, unknown>);
    } else {
      blocks = {
        error: blocksRes.status,
        body: (await blocksRes.text()).slice(0, 500),
      };
    }

    results.push({
      automation: { id: auto.id, name: auto.name, status: auto.status },
      blockKeys,
      blocks,
    });
  }

  return NextResponse.json({ results });
}

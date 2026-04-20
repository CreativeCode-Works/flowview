import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Zapier calls this endpoint to verify the user's API key is valid.
// This is the "Test Authentication" step in Zapier's integration setup.
export async function GET(request: Request) {
  // Zapier sends the API key as a URL param or header depending on config
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

  // Look up the account by API key
  const { data: account, error } = await supabase
    .from("accounts")
    .select("id, name, owner_id")
    .eq("api_key", apiKey)
    .single();

  if (error || !account) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  // Zapier expects a JSON object with user-identifying info
  return NextResponse.json({
    id: account.id,
    name: account.name,
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Zapier calls this endpoint to verify the user's API key is valid.
// This is the "Test Authentication" step in Zapier's integration setup.
export async function GET(request: Request) {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401 }
    );
  }

  const supabase = await createClient();

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

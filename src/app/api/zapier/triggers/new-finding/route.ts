import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Zapier polls this endpoint to check for new audit findings.
// Returns the most recent findings so Zapier can trigger workflows.
export async function GET(request: Request) {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key" },
      { status: 401 }
    );
  }

  const supabase = await createClient();

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

  // Get the 10 most recent findings
  const { data: findings } = await supabase
    .from("audit_findings")
    .select("*")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Zapier expects an array of objects, each with a unique `id`
  const results = (findings ?? []).map((f: Record<string, unknown>) => ({
    id: f.id,
    rule_id: f.rule_id,
    severity: f.severity,
    category: f.category,
    title: f.title,
    explanation: f.explanation,
    created_at: f.created_at,
  }));

  return NextResponse.json(results);
}

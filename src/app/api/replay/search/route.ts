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
  const query = url.searchParams.get("q")?.trim();
  const accountId = url.searchParams.get("accountId");

  if (!query || !accountId) {
    return NextResponse.json({ contacts: [] });
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

  // Search by email or name
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, email, name, phone, platform_ids, tags, first_seen_at, last_seen_at")
    .eq("account_id", accountId)
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);

  return NextResponse.json({ contacts: contacts ?? [] });
}

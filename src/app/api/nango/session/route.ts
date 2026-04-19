import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
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

  // Create a connect session token from Nango
  const response = await fetch("https://api.nango.dev/connect/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NANGO_SECRET_KEY}`,
    },
    body: JSON.stringify({
      end_user: {
        id: account.id,
        email: user.email,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      { error: `Nango error: ${body}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json({ token: data.data.token });
}

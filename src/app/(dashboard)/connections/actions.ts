"use server";

import { createClient } from "@/lib/supabase/server";
import type { Platform } from "@/types/unified";

export async function saveConnection(
  accountId: string,
  platform: Platform,
  nangoConnectionId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from("connections").upsert(
    {
      account_id: accountId,
      platform,
      nango_connection_id: nangoConnectionId,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id,platform" }
  );

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

export async function removeConnection(
  accountId: string,
  platform: Platform
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("connections")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("account_id", accountId)
    .eq("platform", platform);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
}

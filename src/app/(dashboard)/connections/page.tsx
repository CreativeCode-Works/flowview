import { createClient } from "@/lib/supabase/server";
import { ConnectionCard } from "@/components/ConnectionCard";
import { integrations } from "@/integrations/registry";
import type { Platform } from "@/types/unified";

export const metadata = {
  title: "Connections — FlowView",
};

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get or create the user's account
  let { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("owner_id", user!.id)
    .single();

  if (!account) {
    const { data: newAccount } = await supabase
      .from("accounts")
      .insert({ name: user!.email ?? "My Account", owner_id: user!.id })
      .select()
      .single();
    account = newAccount;
  }

  // Get existing connections
  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("account_id", account!.id);

  const connectionMap = new Map(
    (connections ?? []).map((c: { platform: string; status: string; last_synced_at: string | null }) => [c.platform, c])
  );

  const platforms = Object.keys(integrations) as Platform[];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Connections</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Connect your tools to start mapping your automation stack.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const config = integrations[platform];
          const connection = connectionMap.get(platform);
          return (
            <ConnectionCard
              key={platform}
              platform={platform}
              displayName={config.displayName}
              description={config.description}
              status={connection?.status ?? null}
              lastSyncedAt={connection?.last_synced_at ?? null}
              accountId={account!.id}
            />
          );
        })}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/CopyButton";

export const metadata = {
  title: "Settings — FlowView",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("owner_id", user!.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-white">Settings</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Manage your account and API access.
      </p>

      {/* Account Info */}
      <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Account
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500">Email</label>
            <p className="text-sm text-white">{user!.email}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Account Name</label>
            <p className="text-sm text-white">{account?.name ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Account ID</label>
            <p className="font-mono text-xs text-zinc-400">
              {account?.id ?? "—"}
            </p>
          </div>
        </div>
      </section>

      {/* API Key */}
      <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          API Key
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Use this key to connect FlowView with Zapier and other integrations.
          Keep it secret — treat it like a password.
        </p>
        {account?.api_key ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 font-mono text-sm text-white">
              {account.api_key}
            </code>
            <CopyButton text={account.api_key} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No API key found.</p>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-red-900/50 bg-zinc-900 p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">
          Danger Zone
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Deleting your account will permanently remove all your data, connections,
          and audit history. This cannot be undone.
        </p>
        <button
          disabled
          className="h-9 rounded-lg border border-red-800 px-4 text-sm font-medium text-red-400 opacity-50 cursor-not-allowed"
        >
          Delete Account (coming soon)
        </button>
      </section>
    </div>
  );
}

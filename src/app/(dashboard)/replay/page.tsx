import { createClient } from "@/lib/supabase/server";
import { ContactSearch } from "@/components/replay/ContactSearch";

export const metadata = {
  title: "Journey Replay — FlowView",
};

export default async function ReplayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  if (!account) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Journey Replay</h1>
        <p className="text-sm text-zinc-400">Set up your account first.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-white">Journey Replay</h1>
        <p className="text-sm text-zinc-400">
          Search for any contact to see their full journey across your
          automation stack.
        </p>
      </div>
      <ContactSearch accountId={account.id} />
    </div>
  );
}

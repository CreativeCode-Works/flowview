import { createClient } from "@/lib/supabase/server";
import { AuditResults } from "@/components/AuditResults";
import { RunAuditButton } from "@/components/RunAuditButton";

export const metadata = {
  title: "Audit — FlowView",
};

interface Finding {
  id: string;
  rule_id: string;
  severity: string;
  category: string;
  title: string;
  explanation: string;
  affected_nodes: string[];
  affected_contacts: string[];
  created_at: string;
}

interface AuditRun {
  id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  summary: string | null;
  finding_count: number;
  created_at: string;
}

export default async function AuditPage() {
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
        <h1 className="mb-2 text-2xl font-bold text-white">Audit</h1>
        <p className="text-sm text-zinc-400">Set up your account first.</p>
      </div>
    );
  }

  // Get latest audit run
  const { data: latestRun } = await supabase
    .from("audit_runs")
    .select("*")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get findings for latest run
  let findings: Finding[] = [];
  if (latestRun) {
    const { data } = await supabase
      .from("audit_findings")
      .select("*")
      .eq("audit_run_id", latestRun.id)
      .order("severity", { ascending: true });
    findings = (data ?? []) as Finding[];
  }

  const typedRun = latestRun as AuditRun | null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-white">Audit</h1>
          <p className="text-sm text-zinc-400">
            Scan your automation stack for broken flows, tag conflicts, webhook
            failures, and other issues.
          </p>
        </div>
        <RunAuditButton accountId={account.id} />
      </div>

      {typedRun && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Last audit:{" "}
                {typedRun.completed_at
                  ? new Date(typedRun.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "In progress..."}
              </p>
              <p className="text-xs text-zinc-500">
                {typedRun.finding_count} finding
                {typedRun.finding_count !== 1 ? "s" : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                typedRun.status === "completed"
                  ? "bg-emerald-900/50 text-emerald-400"
                  : typedRun.status === "failed"
                    ? "bg-red-900/50 text-red-400"
                    : "bg-yellow-900/50 text-yellow-400"
              }`}
            >
              {typedRun.status}
            </span>
          </div>
          {typedRun.summary && (
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">
              {typedRun.summary}
            </p>
          )}
        </div>
      )}

      <AuditResults findings={findings} />
    </div>
  );
}

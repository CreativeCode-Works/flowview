import { createClient } from "@/lib/supabase/server";
import { FlowGraph } from "@/components/FlowGraph";
import type { FlowNode, FlowEdge, Platform, NodeType, EdgeType } from "@/types/unified";

export const metadata = {
  title: "Flow Graph — FlowView",
};

export default async function GraphPage() {
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
        <h1 className="mb-2 text-2xl font-bold text-white">Flow Graph</h1>
        <p className="text-sm text-zinc-400">Set up your account first.</p>
      </div>
    );
  }

  const { data: rawNodes } = await supabase
    .from("flow_nodes")
    .select("*")
    .eq("account_id", account.id);

  const { data: rawEdges } = await supabase
    .from("flow_edges")
    .select("*")
    .eq("account_id", account.id);

  const flowNodes: FlowNode[] = (rawNodes ?? []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    accountId: n.account_id as string,
    platform: n.platform as Platform,
    platformId: n.platform_id as string,
    nodeType: n.node_type as NodeType,
    name: n.name as string,
    status: n.status as string | null,
    config: (n.config ?? {}) as Record<string, unknown>,
    createdAt: n.created_at as string,
    updatedAt: n.updated_at as string,
  }));

  const flowEdges: FlowEdge[] = (rawEdges ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    accountId: e.account_id as string,
    sourceNodeId: e.source_node_id as string,
    targetNodeId: e.target_node_id as string,
    edgeType: e.edge_type as EdgeType,
    label: e.label as string | null,
    metadata: (e.metadata ?? {}) as Record<string, unknown>,
    createdAt: e.created_at as string,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-white">Flow Graph</h1>
          <p className="text-sm text-zinc-400">
            {flowNodes.length > 0
              ? `${flowNodes.length} nodes across your automation stack`
              : "Connect your tools and run a sync to see your flow graph."}
          </p>
        </div>
        {flowNodes.length > 0 && (
          <div className="flex gap-3">
            {(["activecampaign", "zapier", "stripe"] as Platform[]).map(
              (p) => {
                const count = flowNodes.filter((n) => n.platform === p).length;
                if (count === 0) return null;
                const colors: Record<Platform, string> = {
                  activecampaign: "bg-blue-600",
                  zapier: "bg-orange-500",
                  stripe: "bg-purple-600",
                };
                const labels: Record<Platform, string> = {
                  activecampaign: "AC",
                  zapier: "Zapier",
                  stripe: "Stripe",
                };
                return (
                  <span
                    key={p}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${colors[p]}`}
                  >
                    {labels[p]}: {count}
                  </span>
                );
              }
            )}
          </div>
        )}
      </div>
      <FlowGraph flowNodes={flowNodes} flowEdges={flowEdges} />
    </div>
  );
}

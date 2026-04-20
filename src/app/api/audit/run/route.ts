import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAllRules } from "@/audit-rules/registry";
import { generateAuditSummary } from "@/lib/claude";
import type { AuditContext, Platform, NodeType, EdgeType } from "@/types/unified";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await request.json();

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

  // Create audit run
  const { data: auditRun } = await supabase
    .from("audit_runs")
    .insert({
      account_id: accountId,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!auditRun) {
    return NextResponse.json({ error: "Failed to create audit run" }, { status: 500 });
  }

  try {
    // Fetch all data for audit context
    const [
      { data: rawContacts },
      { data: rawEvents },
      { data: rawNodes },
      { data: rawEdges },
      { data: rawClusters },
    ] = await Promise.all([
      supabase.from("contacts").select("*").eq("account_id", accountId),
      supabase.from("events").select("*").eq("account_id", accountId),
      supabase.from("flow_nodes").select("*").eq("account_id", accountId),
      supabase.from("flow_edges").select("*").eq("account_id", accountId),
      supabase.from("identity_clusters").select("*").eq("account_id", accountId),
    ]);

    const context: AuditContext = {
      accountId,
      contacts: (rawContacts ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        accountId: c.account_id as string,
        email: c.email as string | null,
        name: c.name as string | null,
        phone: c.phone as string | null,
        platformIds: (c.platform_ids ?? {}) as Record<string, string | null>,
        tags: (c.tags ?? []) as string[],
        firstSeenAt: c.first_seen_at as string | null,
        lastSeenAt: c.last_seen_at as string | null,
        createdAt: c.created_at as string,
        updatedAt: c.updated_at as string,
      })),
      events: (rawEvents ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        accountId: e.account_id as string,
        contactId: e.contact_id as string,
        platform: e.platform as Platform,
        eventType: e.event_type as string,
        timestamp: e.timestamp as string,
        sourceNodeId: e.source_node_id as string | null,
        metadata: (e.metadata ?? {}) as Record<string, unknown>,
        createdAt: e.created_at as string,
      })),
      nodes: (rawNodes ?? []).map((n: Record<string, unknown>) => ({
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
      })),
      edges: (rawEdges ?? []).map((e: Record<string, unknown>) => ({
        id: e.id as string,
        accountId: e.account_id as string,
        sourceNodeId: e.source_node_id as string,
        targetNodeId: e.target_node_id as string,
        edgeType: e.edge_type as EdgeType,
        label: e.label as string | null,
        metadata: (e.metadata ?? {}) as Record<string, unknown>,
        createdAt: e.created_at as string,
      })),
      clusters: (rawClusters ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        accountId: c.account_id as string,
        contactIds: (c.contact_ids ?? []) as string[],
        matchReason: c.match_reason as string,
        confidence: c.confidence as number,
        resolved: c.resolved as boolean,
        createdAt: c.created_at as string,
      })),
    };

    // Run all audit rules
    const findings = runAllRules(context);

    // Insert findings
    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        audit_run_id: auditRun.id,
        account_id: accountId,
        rule_id: f.ruleId,
        severity: f.severity,
        category: f.category,
        title: f.title,
        explanation: f.explanation,
        affected_nodes: f.affectedNodes,
        affected_contacts: f.affectedContacts,
        metadata: f.metadata,
      }));

      await supabase.from("audit_findings").insert(rows);
    }

    // Generate AI summary
    const summary = await generateAuditSummary(findings);

    // Update audit run
    await supabase
      .from("audit_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        finding_count: findings.length,
        summary,
      })
      .eq("id", auditRun.id);

    return NextResponse.json({
      success: true,
      runId: auditRun.id,
      findingCount: findings.length,
    });
  } catch (err) {
    await supabase
      .from("audit_runs")
      .update({ status: "failed" })
      .eq("id", auditRun.id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audit failed" },
      { status: 500 }
    );
  }
}

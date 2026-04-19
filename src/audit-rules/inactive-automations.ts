import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "inactive-automations",
  name: "Inactive Automations",
  severity: "warning",
  category: "automation-gaps",
  explanation:
    "Automations or zaps that are turned off but still referenced by other parts of your stack. Contacts may be routed to inactive automations, causing them to silently drop out of your funnel.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Find inactive automation/zap nodes
  const inactiveNodes = context.nodes.filter(
    (n) =>
      (n.nodeType === "automation" || n.nodeType === "zap") &&
      n.status === "inactive"
  );

  // Check if any edges point TO these inactive nodes
  const incomingEdges = new Map<string, string[]>();
  for (const edge of context.edges) {
    const existing = incomingEdges.get(edge.targetNodeId) ?? [];
    existing.push(edge.sourceNodeId);
    incomingEdges.set(edge.targetNodeId, existing);
  }

  for (const node of inactiveNodes) {
    const sources = incomingEdges.get(node.id) ?? [];
    const sourceNames = sources
      .map((id) => context.nodes.find((n) => n.id === id)?.name)
      .filter(Boolean);

    if (sources.length > 0) {
      findings.push({
        ruleId: metadata.id,
        severity: "error",
        category: metadata.category,
        title: `Inactive ${node.nodeType} "${node.name}" still has incoming connections`,
        explanation: `"${node.name}" is turned off but ${sources.length} other node(s) still route to it: ${sourceNames.join(", ")}. Contacts reaching this point will silently stop progressing.`,
        affectedNodes: [node.id, ...sources],
        affectedContacts: [],
        metadata: {
          nodeType: node.nodeType,
          platform: node.platform,
          incomingCount: sources.length,
        },
      });
    } else {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `Inactive ${node.nodeType}: "${node.name}"`,
        explanation: `"${node.name}" on ${node.platform} is turned off. If this is intentional, consider archiving it to reduce clutter.`,
        affectedNodes: [node.id],
        affectedContacts: [],
        metadata: {
          nodeType: node.nodeType,
          platform: node.platform,
        },
      });
    }
  }

  return findings;
}

import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "disconnected-nodes",
  name: "Disconnected Automation Nodes",
  severity: "info",
  category: "flow-integrity",
  explanation:
    "Automation nodes (automations, zaps, campaigns) that have no connections to other nodes in your flow graph. These are isolated and may indicate incomplete setup.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const connectedNodeIds = new Set<string>();
  for (const edge of context.edges) {
    connectedNodeIds.add(edge.sourceNodeId);
    connectedNodeIds.add(edge.targetNodeId);
  }

  const actionableTypes = new Set(["automation", "zap", "email_campaign"]);
  const disconnected = context.nodes.filter(
    (n) => actionableTypes.has(n.nodeType) && n.status === "active" && !connectedNodeIds.has(n.id)
  );

  if (disconnected.length > 0) {
    for (const node of disconnected) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `"${node.name}" is not connected to any other node`,
        explanation: `This active ${node.nodeType} on ${node.platform} has no connections to other parts of your automation flow. It may be working in isolation, which could mean contacts passing through it aren't being tracked in the broader context.`,
        affectedNodes: [node.id],
        affectedContacts: [],
        metadata: { nodeType: node.nodeType, platform: node.platform },
      });
    }
  }

  return findings;
}

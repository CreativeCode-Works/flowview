import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "unused-lists",
  name: "Unused Lists",
  severity: "info",
  category: "data-quality",
  explanation:
    "Email lists with zero subscribers or that aren't referenced by any automation or campaign. These add clutter and should be archived.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const lists = context.nodes.filter((n) => n.nodeType === "list");

  const referencedNodeIds = new Set<string>();
  for (const edge of context.edges) {
    referencedNodeIds.add(edge.sourceNodeId);
    referencedNodeIds.add(edge.targetNodeId);
  }

  for (const list of lists) {
    const subscriberCount = (list.config?.subscriberCount as number) ?? -1;
    const isReferenced = referencedNodeIds.has(list.id);

    if (subscriberCount === 0 || (!isReferenced && subscriberCount >= 0)) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `List "${list.name}" ${subscriberCount === 0 ? "has zero subscribers" : "is not used by any automation"}`,
        explanation: subscriberCount === 0
          ? `This list on ${list.platform} has no subscribers. Consider removing it to reduce clutter.`
          : `This list on ${list.platform} has ${subscriberCount} subscribers but isn't referenced by any automation or campaign.`,
        affectedNodes: [list.id],
        affectedContacts: [],
        metadata: { subscriberCount, platform: list.platform },
      });
    }
  }

  return findings;
}

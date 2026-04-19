import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "orphaned-tags",
  name: "Orphaned Tags",
  severity: "warning",
  category: "tag-hygiene",
  explanation:
    "Tags that exist in your system but are not referenced by any automation, zap, or campaign. These create noise and make it harder to understand your flows.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Find all tag nodes
  const tagNodes = context.nodes.filter((n) => n.nodeType === "tag");

  // Find all node IDs referenced by edges
  const referencedNodeIds = new Set<string>();
  for (const edge of context.edges) {
    referencedNodeIds.add(edge.sourceNodeId);
    referencedNodeIds.add(edge.targetNodeId);
  }

  // Also check if any events reference the tag
  const tagNamesInEvents = new Set<string>();
  for (const event of context.events) {
    if (event.eventType === "tag_added" || event.eventType === "tag_removed") {
      const tagName = event.metadata?.tagName as string | undefined;
      if (tagName) tagNamesInEvents.add(tagName.toLowerCase());
    }
  }

  for (const tag of tagNodes) {
    const isEdgeReferenced = referencedNodeIds.has(tag.id);
    const isEventReferenced = tagNamesInEvents.has(tag.name.toLowerCase());

    if (!isEdgeReferenced && !isEventReferenced) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `Orphaned tag: "${tag.name}"`,
        explanation: `The tag "${tag.name}" exists in ${tag.platform} but is not used by any automation, zap, or campaign. Consider removing it to reduce clutter.`,
        affectedNodes: [tag.id],
        affectedContacts: [],
        metadata: { tagName: tag.name, platform: tag.platform },
      });
    }
  }

  return findings;
}

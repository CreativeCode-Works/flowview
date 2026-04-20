import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "duplicate-webhooks",
  name: "Duplicate Webhooks",
  severity: "warning",
  category: "webhook-reliability",
  explanation:
    "Multiple webhooks pointing to the same URL. This causes duplicate data processing and can lead to double-charges, duplicate contacts, or conflicting automation triggers.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const webhookNodes = context.nodes.filter((n) => n.nodeType === "webhook");

  const urlMap = new Map<string, typeof webhookNodes>();
  for (const node of webhookNodes) {
    const url = node.config?.url as string | undefined;
    if (!url) continue;
    const existing = urlMap.get(url) ?? [];
    existing.push(node);
    urlMap.set(url, existing);
  }

  for (const [url, nodes] of urlMap) {
    if (nodes.length > 1) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `${nodes.length} webhooks point to the same URL`,
        explanation: `These webhooks on ${[...new Set(nodes.map((n) => n.platform))].join(", ")} all point to ${url}. This will cause duplicate processing. Remove duplicates or differentiate the endpoints.`,
        affectedNodes: nodes.map((n) => n.id),
        affectedContacts: [],
        metadata: { url, count: nodes.length },
      });
    }
  }

  return findings;
}

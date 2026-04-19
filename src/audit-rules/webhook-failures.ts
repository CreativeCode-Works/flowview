import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "webhook-failures",
  name: "Webhook Failures",
  severity: "error",
  category: "webhook-reliability",
  explanation:
    "Webhooks that have failed recently or appear to be misconfigured. Failed webhooks mean data isn't flowing between your tools, causing contacts to fall through the cracks.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Find webhook nodes
  const webhookNodes = context.nodes.filter((n) => n.nodeType === "webhook");

  // Look for webhook failure events
  const failedWebhookEvents = context.events.filter(
    (e) => e.eventType === "webhook_failed"
  );

  // Group failures by source node
  const failuresByNode = new Map<string, number>();
  for (const event of failedWebhookEvents) {
    if (event.sourceNodeId) {
      const count = failuresByNode.get(event.sourceNodeId) ?? 0;
      failuresByNode.set(event.sourceNodeId, count + 1);
    }
  }

  // Report webhooks with failures
  for (const [nodeId, failureCount] of failuresByNode) {
    const node = context.nodes.find((n) => n.id === nodeId);
    findings.push({
      ruleId: metadata.id,
      severity: metadata.severity,
      category: metadata.category,
      title: `Webhook "${node?.name ?? nodeId}" has ${failureCount} recent failures`,
      explanation: `This webhook on ${node?.platform ?? "unknown"} has failed ${failureCount} time(s) recently. Check the endpoint URL and ensure the receiving service is operational.`,
      affectedNodes: [nodeId],
      affectedContacts: [],
      metadata: {
        failureCount,
        platform: node?.platform,
        url: node?.config?.url,
      },
    });
  }

  // Check for inactive/disabled webhooks
  for (const webhook of webhookNodes) {
    if (webhook.status === "inactive") {
      findings.push({
        ruleId: metadata.id,
        severity: "warning",
        category: metadata.category,
        title: `Webhook "${webhook.name}" is disabled`,
        explanation: `This webhook on ${webhook.platform} is disabled. If it was auto-disabled due to failures, the receiving endpoint may need to be fixed before re-enabling.`,
        affectedNodes: [webhook.id],
        affectedContacts: [],
        metadata: {
          platform: webhook.platform,
          url: webhook.config?.url,
        },
      });
    }
  }

  return findings;
}

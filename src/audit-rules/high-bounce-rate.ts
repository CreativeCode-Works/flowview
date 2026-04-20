import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "high-bounce-rate",
  name: "High Bounce Rate Campaigns",
  severity: "warning",
  category: "data-quality",
  explanation:
    "Email campaigns with bounce rates above 5%. High bounce rates damage sender reputation and can cause deliverability issues across all your emails.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const campaigns = context.nodes.filter((n) => n.nodeType === "email_campaign");

  for (const campaign of campaigns) {
    const sendCount = (campaign.config?.sendCount as number) ?? 0;
    const bounces = (campaign.config?.bounces as number) ?? 0;

    if (sendCount > 50 && bounces / sendCount > 0.05) {
      const bounceRate = ((bounces / sendCount) * 100).toFixed(1);
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `Campaign "${campaign.name}" has ${bounceRate}% bounce rate`,
        explanation: `This campaign had ${bounces} bounces out of ${sendCount} sends (${bounceRate}%). Bounce rates above 5% damage sender reputation. Clean your list and remove invalid addresses.`,
        affectedNodes: [campaign.id],
        affectedContacts: [],
        metadata: { bounceRate: parseFloat(bounceRate), sendCount, bounces },
      });
    }
  }

  return findings;
}

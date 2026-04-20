import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "abandoned-deals",
  name: "Abandoned Deals",
  severity: "warning",
  category: "automation-gaps",
  explanation:
    "Open deals that haven't been updated in over 30 days. These may represent lost opportunities or require manual follow-up.",
};

const STALE_THRESHOLD_DAYS = 30;

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const now = new Date();

  const dealEvents = context.events.filter(
    (e) => e.eventType === "deal_created" || e.eventType === "deal_updated"
  );

  const dealLastActivity = new Map<string, Date>();
  for (const event of dealEvents) {
    const dealId = event.metadata?.dealId as string | undefined;
    if (!dealId) continue;
    const ts = new Date(event.timestamp);
    const existing = dealLastActivity.get(dealId);
    if (!existing || ts > existing) {
      dealLastActivity.set(dealId, ts);
    }
  }

  for (const [dealId, lastActivity] of dealLastActivity) {
    const daysSince = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > STALE_THRESHOLD_DAYS) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `Deal "${dealId}" has been idle for ${daysSince} days`,
        explanation: `This deal hasn't been updated in ${daysSince} days. If it's still open, it may need follow-up. If it's dead, close it to keep your pipeline clean.`,
        affectedNodes: [],
        affectedContacts: [],
        metadata: { dealId, daysSince, lastActivity: lastActivity.toISOString() },
      });
    }
  }

  return findings;
}

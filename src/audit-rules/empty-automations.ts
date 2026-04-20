import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "empty-automations",
  name: "Empty Automations",
  severity: "info",
  category: "automation-gaps",
  explanation:
    "Active automations with zero contacts entered. These may be misconfigured, have broken triggers, or are simply unused.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const automations = context.nodes.filter(
    (n) => n.nodeType === "automation" && n.status === "active"
  );

  for (const automation of automations) {
    const entered = (automation.config?.entered as number) ?? -1;
    if (entered === 0) {
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `Active automation "${automation.name}" has zero contacts`,
        explanation: `This automation on ${automation.platform} is active but no contacts have ever entered it. Check that its trigger is configured correctly.`,
        affectedNodes: [automation.id],
        affectedContacts: [],
        metadata: { platform: automation.platform },
      });
    }
  }

  return findings;
}

import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "missing-email-contacts",
  name: "Contacts Without Email",
  severity: "info",
  category: "data-quality",
  explanation:
    "Contacts that exist in your system without an email address. These contacts can't be reached by email automations and may cause silent failures.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const noEmailContacts = context.contacts.filter((c) => !c.email);

  if (noEmailContacts.length > 0) {
    const platforms = new Set<string>();
    for (const c of noEmailContacts) {
      for (const [p, id] of Object.entries(c.platformIds)) {
        if (id) platforms.add(p);
      }
    }

    findings.push({
      ruleId: metadata.id,
      severity: metadata.severity,
      category: metadata.category,
      title: `${noEmailContacts.length} contact${noEmailContacts.length !== 1 ? "s" : ""} without email addresses`,
      explanation: `Found ${noEmailContacts.length} contacts across ${Array.from(platforms).join(", ")} that have no email address. These contacts can't be reached by email automations and may cause issues in flows that assume an email exists.`,
      affectedNodes: [],
      affectedContacts: noEmailContacts.map((c) => c.id),
      metadata: { count: noEmailContacts.length, platforms: Array.from(platforms) },
    });
  }

  return findings;
}

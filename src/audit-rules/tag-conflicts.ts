import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "tag-conflicts",
  name: "Conflicting Tags on Contacts",
  severity: "warning",
  category: "tag-hygiene",
  explanation:
    "Contacts that have mutually exclusive tags applied simultaneously, indicating broken automation logic or race conditions.",
};

const CONFLICTING_PAIRS = [
  ["customer", "prospect"],
  ["active", "churned"],
  ["subscribed", "unsubscribed"],
  ["qualified", "disqualified"],
  ["trial", "paid"],
  ["vip", "inactive"],
];

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const contact of context.contacts) {
    if (contact.tags.length < 2) continue;

    const lowerTags = contact.tags.map((t) => t.toLowerCase());

    for (const [tagA, tagB] of CONFLICTING_PAIRS) {
      const hasA = lowerTags.some((t) => t.includes(tagA));
      const hasB = lowerTags.some((t) => t.includes(tagB));

      if (hasA && hasB) {
        const matchedA = contact.tags.find((t) => t.toLowerCase().includes(tagA));
        const matchedB = contact.tags.find((t) => t.toLowerCase().includes(tagB));

        findings.push({
          ruleId: metadata.id,
          severity: metadata.severity,
          category: metadata.category,
          title: `"${contact.email}" has conflicting tags: "${matchedA}" and "${matchedB}"`,
          explanation: `This contact has both "${matchedA}" and "${matchedB}" applied, which are typically mutually exclusive. This may indicate a broken automation that's not removing the old tag when applying the new one.`,
          affectedNodes: [],
          affectedContacts: [contact.id],
          metadata: { tagA: matchedA, tagB: matchedB },
        });
      }
    }
  }

  return findings;
}

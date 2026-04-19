import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "identity-fragmentation",
  name: "Identity Fragmentation",
  severity: "warning",
  category: "identity-fragmentation",
  explanation:
    "Contacts that appear to be the same person across different platforms but have different email addresses or identifiers. These fragments mean a single customer's journey is split across multiple records.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const cluster of context.clusters) {
    if (cluster.resolved) continue;

    const clusterContacts = cluster.contactIds
      .map((id) => context.contacts.find((c) => c.id === id))
      .filter(Boolean);

    const emails = clusterContacts
      .map((c) => c!.email)
      .filter(Boolean) as string[];

    const platforms = new Set<string>();
    for (const contact of clusterContacts) {
      if (!contact) continue;
      for (const [platform, id] of Object.entries(contact.platformIds)) {
        if (id) platforms.add(platform);
      }
    }

    findings.push({
      ruleId: metadata.id,
      severity: metadata.severity,
      category: metadata.category,
      title: `${cluster.contactIds.length} contacts appear to be the same person`,
      explanation: `These contacts across ${Array.from(platforms).join(", ")} appear to be the same person (${cluster.matchReason}, confidence: ${Math.round(cluster.confidence * 100)}%). Emails: ${emails.join(", ") || "none matched"}. Review and confirm whether they should be treated as one contact.`,
      affectedNodes: [],
      affectedContacts: cluster.contactIds,
      metadata: {
        matchReason: cluster.matchReason,
        confidence: cluster.confidence,
        platforms: Array.from(platforms),
        emails,
      },
    });
  }

  return findings;
}

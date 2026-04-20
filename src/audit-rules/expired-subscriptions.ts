import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "expired-subscriptions",
  name: "Expired Subscriptions Without Follow-Up",
  severity: "warning",
  category: "subscription-risk",
  explanation:
    "Contacts whose subscriptions have expired or been canceled but who haven't received any follow-up automation (win-back email, survey, etc.).",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const cancelEvents = context.events.filter(
    (e) => e.eventType === "subscription_canceled"
  );

  for (const cancelEvent of cancelEvents) {
    if (!cancelEvent.contactId) continue;

    const eventsAfterCancel = context.events.filter(
      (e) =>
        e.contactId === cancelEvent.contactId &&
        new Date(e.timestamp) > new Date(cancelEvent.timestamp) &&
        e.platform === "activecampaign" &&
        (e.eventType === "email_sent" || e.eventType === "automation_entered")
    );

    if (eventsAfterCancel.length === 0) {
      const contact = context.contacts.find((c) => c.id === cancelEvent.contactId);
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `No follow-up after cancellation for "${contact?.email ?? cancelEvent.contactId}"`,
        explanation: `This contact's subscription was canceled but they haven't received any follow-up emails or entered any win-back automations. Consider adding a cancellation follow-up sequence.`,
        affectedNodes: [],
        affectedContacts: [cancelEvent.contactId],
        metadata: { canceledAt: cancelEvent.timestamp },
      });
    }
  }

  return findings;
}

import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "payment-failures",
  name: "Recurring Payment Failures",
  severity: "error",
  category: "subscription-risk",
  explanation:
    "Contacts with multiple failed payment attempts. These customers are at high risk of involuntary churn and may need manual intervention.",
};

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];

  const failedPayments = context.events.filter(
    (e) => e.eventType === "charge_failed" || e.eventType === "invoice_payment_failed"
  );

  const failuresByContact = new Map<string, number>();
  for (const event of failedPayments) {
    if (!event.contactId) continue;
    const count = failuresByContact.get(event.contactId) ?? 0;
    failuresByContact.set(event.contactId, count + 1);
  }

  for (const [contactId, count] of failuresByContact) {
    if (count >= 2) {
      const contact = context.contacts.find((c) => c.id === contactId);
      findings.push({
        ruleId: metadata.id,
        severity: metadata.severity,
        category: metadata.category,
        title: `${count} failed payments for "${contact?.email ?? contactId}"`,
        explanation: `This customer has had ${count} failed payment attempts. They are at high risk of involuntary churn. Reach out to update their payment method.`,
        affectedNodes: [],
        affectedContacts: [contactId],
        metadata: { failureCount: count },
      });
    }
  }

  return findings;
}

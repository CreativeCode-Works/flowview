import type { AuditRuleMetadata, AuditFinding, AuditContext } from "@/types/unified";

export const metadata: AuditRuleMetadata = {
  id: "stuck-contacts",
  name: "Stuck Contacts",
  severity: "error",
  category: "contact-health",
  explanation:
    "Contacts that entered an automation but have had no activity for an unusually long period. These contacts may be stuck in a wait step, caught in a loop, or affected by a broken automation.",
};

const STUCK_THRESHOLD_DAYS = 30;

export function evaluate(context: AuditContext): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const now = new Date();
  const thresholdMs = STUCK_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  // Group events by contact
  const eventsByContact = new Map<string, typeof context.events>();
  for (const event of context.events) {
    if (!event.contactId) continue;
    const existing = eventsByContact.get(event.contactId) ?? [];
    existing.push(event);
    eventsByContact.set(event.contactId, existing);
  }

  // Find contacts who entered an automation but haven't had recent activity
  for (const [contactId, events] of eventsByContact) {
    const automationEntries = events.filter(
      (e) => e.eventType === "automation_entered"
    );
    const automationCompletions = events.filter(
      (e) =>
        e.eventType === "automation_completed" ||
        e.eventType === "automation_skipped"
    );

    // Get automation IDs that were entered but not completed
    const enteredAutomationIds = new Set(
      automationEntries.map(
        (e) => (e.metadata?.automationId as string) ?? ""
      )
    );
    const completedAutomationIds = new Set(
      automationCompletions.map(
        (e) => (e.metadata?.automationId as string) ?? ""
      )
    );

    for (const automationId of enteredAutomationIds) {
      if (!automationId || completedAutomationIds.has(automationId)) continue;

      // Find the entry event
      const entryEvent = automationEntries.find(
        (e) => (e.metadata?.automationId as string) === automationId
      );
      if (!entryEvent) continue;

      // Check last activity for this contact in this automation
      const lastActivity = events
        .filter(
          (e) =>
            (e.metadata?.automationId as string) === automationId
        )
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

      if (!lastActivity) continue;

      const lastActivityDate = new Date(lastActivity.timestamp);
      const daysSinceActivity = Math.floor(
        (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (now.getTime() - lastActivityDate.getTime() > thresholdMs) {
        const contact = context.contacts.find((c) => c.id === contactId);
        const automationNode = context.nodes.find(
          (n) =>
            n.platformId === automationId &&
            n.nodeType === "automation"
        );

        findings.push({
          ruleId: metadata.id,
          severity: metadata.severity,
          category: metadata.category,
          title: `Contact "${contact?.email ?? contactId}" stuck in "${automationNode?.name ?? automationId}"`,
          explanation: `This contact entered the automation ${daysSinceActivity} days ago and has had no activity for ${daysSinceActivity} days. They may be stuck in a wait step, caught in a conditional loop, or affected by a broken action.`,
          affectedNodes: automationNode ? [automationNode.id] : [],
          affectedContacts: [contactId],
          metadata: {
            daysSinceActivity,
            lastActivityDate: lastActivity.timestamp,
            automationId,
            contactEmail: contact?.email,
          },
        });
      }
    }
  }

  return findings;
}

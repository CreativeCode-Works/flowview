import type {
  AuditRuleMetadata,
  AuditFinding,
  AuditContext,
} from "@/types/unified";

export interface AuditRule {
  metadata: AuditRuleMetadata;
  evaluate: (context: AuditContext) => AuditFinding[];
}

// Rules are registered here as they're implemented.
// Import and add each rule to this array.
const rules: AuditRule[] = [
  // Phase 1 rules will be added here, e.g.:
  // orphanedTags,
  // inactiveAutomations,
  // identityFragmentation,
  // failedWebhooks,
  // stuckContacts,
  // missingTagHandler,
  // emptyAutomations,
  // duplicateWebhooks,
  // expiredSubscriptions,
  // unlinkedZaps,
];

export function getAllRules(): AuditRule[] {
  return rules;
}

export function getRuleById(id: string): AuditRule | undefined {
  return rules.find((r) => r.metadata.id === id);
}

export function runAllRules(context: AuditContext): AuditFinding[] {
  return rules.flatMap((rule) => rule.evaluate(context));
}

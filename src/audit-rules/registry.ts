import type {
  AuditRuleMetadata,
  AuditFinding,
  AuditContext,
} from "@/types/unified";

import * as orphanedTags from "./orphaned-tags";
import * as inactiveAutomations from "./inactive-automations";
import * as identityFragmentation from "./identity-fragmentation";
import * as webhookFailures from "./webhook-failures";
import * as stuckContacts from "./stuck-contacts";

export interface AuditRule {
  metadata: AuditRuleMetadata;
  evaluate: (context: AuditContext) => AuditFinding[];
}

const rules: AuditRule[] = [
  orphanedTags,
  inactiveAutomations,
  identityFragmentation,
  webhookFailures,
  stuckContacts,
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

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
import * as duplicateWebhooks from "./duplicate-webhooks";
import * as emptyAutomations from "./empty-automations";
import * as expiredSubscriptions from "./expired-subscriptions";
import * as paymentFailures from "./payment-failures";
import * as highBounceRate from "./high-bounce-rate";
import * as abandonedDeals from "./abandoned-deals";
import * as unusedLists from "./unused-lists";
import * as tagConflicts from "./tag-conflicts";
import * as missingEmailContacts from "./missing-email-contacts";
import * as disconnectedNodes from "./disconnected-nodes";

export interface AuditRule {
  metadata: AuditRuleMetadata;
  evaluate: (context: AuditContext) => AuditFinding[];
}

const rules: AuditRule[] = [
  // Critical
  webhookFailures,
  paymentFailures,
  stuckContacts,

  // Warnings
  inactiveAutomations,
  identityFragmentation,
  orphanedTags,
  duplicateWebhooks,
  expiredSubscriptions,
  highBounceRate,
  abandonedDeals,
  tagConflicts,

  // Info
  emptyAutomations,
  unusedLists,
  missingEmailContacts,
  disconnectedNodes,
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

// ============================================================
// Unified schema types for FlowView
// These types represent the normalized, cross-platform data model.
// ============================================================

export type Platform = "activecampaign" | "zapier" | "stripe";

// ============================================================
// Contacts
// ============================================================

export type PlatformIds = Partial<Record<Platform, string | null>>;

export interface Contact {
  id: string;
  accountId: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  platformIds: PlatformIds;
  tags: string[];
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Events
// ============================================================

export interface Event {
  id: string;
  accountId: string;
  contactId: string;
  platform: Platform;
  eventType: string;
  timestamp: string;
  sourceNodeId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type EventType =
  // ActiveCampaign
  | "automation_entered"
  | "automation_completed"
  | "automation_skipped"
  | "email_sent"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "tag_added"
  | "tag_removed"
  | "contact_created"
  | "contact_updated"
  | "deal_created"
  | "deal_updated"
  | "deal_won"
  | "deal_lost"
  // Zapier
  | "zap_run_started"
  | "zap_run_completed"
  | "zap_run_errored"
  | "zap_turned_on"
  | "zap_turned_off"
  // Stripe
  | "charge_succeeded"
  | "charge_failed"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_canceled"
  | "invoice_paid"
  | "invoice_payment_failed"
  | "customer_created"
  | "checkout_completed"
  // Generic
  | "webhook_received"
  | "webhook_failed";

// ============================================================
// Flow Graph
// ============================================================

export type NodeType =
  | "automation"
  | "zap"
  | "product"
  | "tag"
  | "webhook"
  | "pipeline_stage"
  | "email_campaign"
  | "form"
  | "list"
  | "price"
  | "subscription_plan";

export interface FlowNode {
  id: string;
  accountId: string;
  platform: Platform;
  platformId: string;
  nodeType: NodeType;
  name: string;
  status: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type EdgeType =
  | "triggers"
  | "adds_tag"
  | "removes_tag"
  | "creates_customer"
  | "webhook_to"
  | "subscribes_to"
  | "moves_to_stage"
  | "sends_email"
  | "adds_to_list"
  | "creates_deal";

export interface FlowEdge {
  id: string;
  accountId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  label: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// Identity Clusters (fragmented identity detection)
// ============================================================

export interface IdentityCluster {
  id: string;
  accountId: string;
  contactIds: string[];
  matchReason: string;
  confidence: number;
  resolved: boolean;
  createdAt: string;
}

// ============================================================
// Audit
// ============================================================

export type AuditSeverity = "info" | "warning" | "error";

export type AuditCategory =
  | "tag-hygiene"
  | "webhook-reliability"
  | "flow-integrity"
  | "contact-health"
  | "identity-fragmentation"
  | "subscription-risk"
  | "automation-gaps"
  | "data-quality";

export interface AuditRuleMetadata {
  id: string;
  name: string;
  severity: AuditSeverity;
  category: AuditCategory;
  explanation: string;
}

export interface AuditFinding {
  ruleId: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  explanation: string;
  affectedNodes: string[];
  affectedContacts: string[];
  metadata: Record<string, unknown>;
}

export interface AuditContext {
  accountId: string;
  contacts: Contact[];
  events: Event[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  clusters: IdentityCluster[];
}

export interface AuditRun {
  id: string;
  accountId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  summary: string | null;
  findingCount: number;
  createdAt: string;
}

// ============================================================
// Connections
// ============================================================

export type ConnectionStatus = "active" | "inactive" | "error";

export interface Connection {
  id: string;
  accountId: string;
  platform: Platform;
  nangoConnectionId: string;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Sync helpers
// ============================================================

export interface SyncResult<T> {
  data: T[];
  errors: SyncError[];
  cursor: string | null;
}

export interface SyncError {
  platform: Platform;
  operation: string;
  message: string;
  raw: unknown;
}

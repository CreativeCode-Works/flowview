import type {
  AcAutomation,
  AcTag,
  AcList,
  AcCampaign,
  AcWebhook,
  AcDealGroup,
  AcDealStage,
  AcContact,
  AcContactAutomation,
  AcActivity,
} from "./types";
import type { FlowNode, Contact, Event } from "@/types/unified";

// ---- Config normalization (→ FlowNode) ----

export function normalizeAutomation(
  a: AcAutomation,
  accountId: string
): FlowNode {
  return {
    id: "", // set by DB on insert
    accountId,
    platform: "activecampaign",
    platformId: a.id,
    nodeType: "automation",
    name: a.name,
    status: a.status === "1" ? "active" : "inactive",
    config: {
      entered: parseInt(a.entered, 10),
      exited: parseInt(a.exited, 10),
    },
    createdAt: a.cdate,
    updatedAt: a.mdate,
  };
}

export function normalizeTag(t: AcTag, accountId: string): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: t.id,
    nodeType: "tag",
    name: t.tag,
    status: null,
    config: {
      subscriberCount: parseInt(t.subscriber_count, 10),
      description: t.description,
    },
    createdAt: t.cdate,
    updatedAt: t.cdate,
  };
}

export function normalizeList(l: AcList, accountId: string): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: l.id,
    nodeType: "list",
    name: l.name,
    status: null,
    config: {
      subscriberCount: parseInt(l.subscriber_count, 10),
      stringId: l.stringid,
    },
    createdAt: l.cdate,
    updatedAt: l.cdate,
  };
}

const CAMPAIGN_STATUS_MAP: Record<string, string> = {
  "0": "draft",
  "1": "scheduled",
  "2": "sending",
  "3": "paused",
  "4": "stopped",
  "5": "completed",
  "6": "disabled",
  "7": "pending_approval",
};

export function normalizeCampaign(
  c: AcCampaign,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: c.id,
    nodeType: "email_campaign",
    name: c.name,
    status: CAMPAIGN_STATUS_MAP[c.status] ?? "unknown",
    config: {
      type: c.type,
      sendCount: parseInt(c.send_amt, 10),
      opens: parseInt(c.opens, 10),
      clicks: parseInt(c.linkclicks, 10),
      bounces:
        parseInt(c.hardbounces, 10) + parseInt(c.softbounces, 10),
      unsubscribes: parseInt(c.unsubscribes, 10),
      automationId: c.seriesid || null,
    },
    createdAt: c.cdate,
    updatedAt: c.cdate,
  };
}

export function normalizeWebhook(
  w: AcWebhook,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: w.id,
    nodeType: "webhook",
    name: w.name,
    status: null,
    config: {
      url: w.url,
      events: w.events,
      sources: w.sources,
    },
    createdAt: w.cdate,
    updatedAt: w.cdate,
  };
}

export function normalizePipeline(
  g: AcDealGroup,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: g.id,
    nodeType: "pipeline_stage", // pipeline itself as a node
    name: g.title,
    status: null,
    config: {
      currency: g.currency,
      stageIds: g.stages,
      isPipeline: true,
    },
    createdAt: g.cdate,
    updatedAt: g.udate,
  };
}

export function normalizePipelineStage(
  s: AcDealStage,
  accountId: string
): FlowNode {
  return {
    id: "",
    accountId,
    platform: "activecampaign",
    platformId: s.id,
    nodeType: "pipeline_stage",
    name: s.title,
    status: null,
    config: {
      pipelineId: s.group,
      order: parseInt(s.order, 10),
      color: s.color,
    },
    createdAt: s.cdate,
    updatedAt: s.udate,
  };
}

// ---- Contact normalization ----

export function normalizeContact(
  c: AcContact,
  accountId: string
): Contact {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
  return {
    id: "", // set by DB on upsert
    accountId,
    email: c.email || null,
    name,
    phone: c.phone || null,
    platformIds: { activecampaign: c.id },
    tags: [], // populated separately via contactTags
    firstSeenAt: c.cdate || null,
    lastSeenAt: c.adate || null,
    createdAt: c.cdate,
    updatedAt: c.udate,
  };
}

// ---- Event normalization ----

const AUTOMATION_STATUS_MAP: Record<string, string> = {
  "1": "automation_entered",
  "2": "automation_completed",
  "0": "automation_skipped",
};

export function normalizeContactAutomationEvents(
  automations: AcContactAutomation[],
  acContactId: string,
  accountId: string
): Event[] {
  const events: Event[] = [];

  for (const a of automations) {
    const eventType = AUTOMATION_STATUS_MAP[a.status] ?? "automation_entered";

    events.push({
      id: "",
      accountId,
      contactId: "", // resolved during DB insert by email match
      platform: "activecampaign",
      eventType,
      timestamp: a.adddate,
      sourceNodeId: null, // linked to automation node during graph build
      metadata: {
        acContactId,
        automationId: a.seriesid,
        completedElements: parseInt(a.completedElements, 10),
        totalElements: parseInt(a.totalElements, 10),
        removedDate: a.remdate,
      },
      createdAt: a.adddate,
    });
  }

  return events;
}

const ACTIVITY_TYPE_MAP: Record<string, string> = {
  open: "email_opened",
  click: "email_clicked",
  bounce: "email_bounced",
  subscribe: "contact_created",
  unsubscribe: "tag_removed",
  sent: "email_sent",
  reply: "email_clicked",
  forward: "email_clicked",
  share: "email_clicked",
};

export function normalizeActivity(
  activity: AcActivity,
  acContactId: string,
  accountId: string
): Event | null {
  const eventType = ACTIVITY_TYPE_MAP[activity.type];
  if (!eventType) return null;

  return {
    id: "",
    accountId,
    contactId: "",
    platform: "activecampaign",
    eventType,
    timestamp: activity.tstamp,
    sourceNodeId: null,
    metadata: {
      acContactId,
      activityType: activity.type,
      text: activity.text,
    },
    createdAt: activity.tstamp,
  };
}

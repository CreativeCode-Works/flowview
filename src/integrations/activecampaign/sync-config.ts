import { ActiveCampaignClient } from "./client";
import { normalizeAutomation, normalizeTag, normalizeList, normalizeCampaign, normalizeWebhook, normalizePipeline, normalizePipelineStage } from "./normalize";
import type { FlowNode } from "@/types/unified";

interface SyncConfigResult {
  nodes: FlowNode[];
  errors: Array<{ operation: string; message: string }>;
}

export async function syncConfig(
  client: ActiveCampaignClient,
  accountId: string
): Promise<SyncConfigResult> {
  const nodes: FlowNode[] = [];
  const errors: Array<{ operation: string; message: string }> = [];

  // Fetch all config data in parallel
  const [automations, tags, lists, campaigns, webhooks, dealGroupsResponse] =
    await Promise.allSettled([
      client.getAutomations(),
      client.getTags(),
      client.getLists(),
      client.getCampaigns(),
      client.getWebhooks(),
      client.getDealGroups(),
    ]);

  if (automations.status === "fulfilled") {
    for (const a of automations.value) {
      nodes.push(normalizeAutomation(a, accountId));
    }
  } else {
    errors.push({ operation: "getAutomations", message: automations.reason?.message ?? "Unknown error" });
  }

  if (tags.status === "fulfilled") {
    for (const t of tags.value) {
      nodes.push(normalizeTag(t, accountId));
    }
  } else {
    errors.push({ operation: "getTags", message: tags.reason?.message ?? "Unknown error" });
  }

  if (lists.status === "fulfilled") {
    for (const l of lists.value) {
      nodes.push(normalizeList(l, accountId));
    }
  } else {
    errors.push({ operation: "getLists", message: lists.reason?.message ?? "Unknown error" });
  }

  if (campaigns.status === "fulfilled") {
    for (const c of campaigns.value) {
      nodes.push(normalizeCampaign(c, accountId));
    }
  } else {
    errors.push({ operation: "getCampaigns", message: campaigns.reason?.message ?? "Unknown error" });
  }

  if (webhooks.status === "fulfilled") {
    for (const w of webhooks.value) {
      nodes.push(normalizeWebhook(w, accountId));
    }
  } else {
    errors.push({ operation: "getWebhooks", message: webhooks.reason?.message ?? "Unknown error" });
  }

  if (dealGroupsResponse.status === "fulfilled") {
    const { dealGroups, dealStages } = dealGroupsResponse.value;
    for (const g of dealGroups) {
      nodes.push(normalizePipeline(g, accountId));
    }
    for (const s of dealStages) {
      nodes.push(normalizePipelineStage(s, accountId));
    }
  } else {
    errors.push({ operation: "getDealGroups", message: dealGroupsResponse.reason?.message ?? "Unknown error" });
  }

  return { nodes, errors };
}

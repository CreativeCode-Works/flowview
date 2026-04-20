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

  // Process automations — also fetch blocks for each to get internal actions
  if (automations.status === "fulfilled") {
    // Fetch blocks for each automation (sequential to respect rate limits)
    for (const a of automations.value) {
      const node = normalizeAutomation(a, accountId);

      try {
        const blocks = await client.getAutomationBlocks(a.id);
        if (blocks.length > 0) {
          // Parse blocks to extract action summary
          const actions = parseBlockActions(blocks);
          node.config = {
            ...node.config,
            blocks: actions,
          };
          console.log(
            `Automation "${a.name}" (${a.id}): ${blocks.length} blocks, ${actions.length} actions`
          );
        }
      } catch (err) {
        // Blocks endpoint may not be available — that's OK
        console.log(
          `Blocks fetch failed for automation ${a.id}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }

      nodes.push(node);
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

/**
 * Parse automation blocks into a simplified action list.
 * We extract the action type and relevant IDs (tag IDs, automation IDs, etc.)
 * so edge inference can build the relationship graph.
 *
 * Block structure varies — we extract what we can and skip what we don't recognize.
 */
interface BlockAction {
  type: string;       // e.g. "add_tag", "remove_tag", "start_automation", "send_email", etc.
  targetId?: string;  // the tag/automation/list/campaign ID being referenced
  targetName?: string;
  blockId: string;
}

function parseBlockActions(blocks: Record<string, unknown>[]): BlockAction[] {
  const actions: BlockAction[] = [];

  for (const block of blocks) {
    const blockId = String(block.id ?? "");
    const type = String(block.type ?? "");

    // Try to extract action details from various possible structures
    // AC blocks can have: type, action, options, config, etc.
    const action = String(block.action ?? "");
    const options = (block.options ?? {}) as Record<string, unknown>;
    const config = (block.config ?? {}) as Record<string, unknown>;

    // Normalize the action type from whatever AC gives us
    const actionType = action || type;

    // Tag actions
    if (actionType.includes("tag") || actionType.includes("Tag")) {
      const tagId = String(options.tag ?? options.tagId ?? config.tag ?? config.tagId ?? "");
      const tagName = String(options.tagName ?? config.tagName ?? "");
      if (tagId || tagName) {
        const isRemove =
          actionType.includes("remove") || actionType.includes("untag");
        actions.push({
          type: isRemove ? "remove_tag" : "add_tag",
          targetId: tagId || undefined,
          targetName: tagName || undefined,
          blockId,
        });
      }
    }

    // Start/end another automation
    if (
      actionType.includes("automation") ||
      actionType.includes("Automation") ||
      actionType.includes("series")
    ) {
      const autoId = String(
        options.automation ??
          options.automationId ??
          options.seriesid ??
          config.automation ??
          config.automationId ??
          config.seriesid ??
          ""
      );
      if (autoId) {
        const isEnd =
          actionType.includes("end") ||
          actionType.includes("stop") ||
          actionType.includes("remove");
        actions.push({
          type: isEnd ? "end_automation" : "start_automation",
          targetId: autoId,
          blockId,
        });
      }
    }

    // Subscribe to list
    if (actionType.includes("list") || actionType.includes("subscribe")) {
      const listId = String(options.list ?? options.listId ?? config.list ?? config.listId ?? "");
      if (listId) {
        actions.push({
          type: "add_to_list",
          targetId: listId,
          blockId,
        });
      }
    }

    // Send email / campaign
    if (
      actionType.includes("email") ||
      actionType.includes("campaign") ||
      actionType.includes("send")
    ) {
      const campaignId = String(
        options.campaign ??
          options.campaignId ??
          options.email ??
          config.campaign ??
          ""
      );
      if (campaignId) {
        actions.push({
          type: "send_email",
          targetId: campaignId,
          blockId,
        });
      }
    }

    // Webhook actions
    if (actionType.includes("webhook")) {
      const url = String(options.url ?? config.url ?? "");
      actions.push({
        type: "webhook",
        targetName: url || undefined,
        blockId,
      });
    }

    // Deal/pipeline actions
    if (actionType.includes("deal") || actionType.includes("pipeline")) {
      const stageId = String(
        options.stage ?? options.dealStage ?? config.stage ?? ""
      );
      if (stageId) {
        actions.push({
          type: "move_to_stage",
          targetId: stageId,
          blockId,
        });
      }
    }

    // If we couldn't categorize but there's useful data, store it generically
    // This helps us discover new block types from logs
    if (actions.length === 0 && actionType && actionType !== "undefined") {
      // Log unrecognized block types for future parsing
      console.log(
        `Unrecognized block type: ${actionType}, keys: ${Object.keys(block).join(",")}`
      );
    }
  }

  return actions;
}

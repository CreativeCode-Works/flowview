import type { FlowNode, EdgeType } from "@/types/unified";

interface InferredEdge {
  accountId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  label: string | null;
  metadata: Record<string, unknown>;
}

interface BlockAction {
  type: string;
  targetId?: string;
  targetName?: string;
  blockId: string;
}

/**
 * Infer edges from node config data and automation block actions.
 *
 * Priority 1 — Block-derived edges (from automation internal steps):
 *   automation --adds_tag--> tag
 *   automation --removes_tag--> tag
 *   automation --triggers--> other automation
 *   automation --sends_email--> campaign
 *   automation --adds_to_list--> list
 *   automation --moves_to_stage--> pipeline stage
 *
 * Priority 2 — Config-derived edges (from node metadata):
 *   campaign --sends_email--> automation (via campaign.config.automationId)
 *   price --> product (via price.config.productId)
 *   stage --> pipeline (via stage.config.pipelineId)
 *
 * Priority 3 — Zapier cross-platform edges (best-effort name matching)
 */
export function inferEdges(nodes: FlowNode[]): InferredEdge[] {
  const edges: InferredEdge[] = [];

  // Build lookup maps
  const byPlatformId = new Map<string, FlowNode>();
  const tagsByName = new Map<string, FlowNode>();
  const nodeById = new Map<string, FlowNode>();

  for (const node of nodes) {
    byPlatformId.set(`${node.platform}:${node.platformId}`, node);
    nodeById.set(node.id, node);
    if (node.nodeType === "tag" && node.platform === "activecampaign") {
      tagsByName.set(node.name.toLowerCase(), node);
    }
  }

  for (const node of nodes) {
    // ---- Priority 1: Block-derived edges (automation internals) ----
    if (
      node.nodeType === "automation" &&
      node.platform === "activecampaign"
    ) {
      const blocks = node.config.blocks as BlockAction[] | undefined;
      if (blocks && blocks.length > 0) {
        for (const action of blocks) {
          switch (action.type) {
            case "add_tag": {
              const tag = resolveTarget(
                "activecampaign",
                "tag",
                action,
                byPlatformId,
                tagsByName
              );
              if (tag) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: tag.id,
                  edgeType: "adds_tag",
                  label: "adds tag",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }

            case "remove_tag": {
              const tag = resolveTarget(
                "activecampaign",
                "tag",
                action,
                byPlatformId,
                tagsByName
              );
              if (tag) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: tag.id,
                  edgeType: "removes_tag",
                  label: "removes tag",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }

            case "start_automation": {
              const target = byPlatformId.get(
                `activecampaign:${action.targetId}`
              );
              if (target) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: target.id,
                  edgeType: "triggers",
                  label: "starts",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }

            case "end_automation": {
              const target = byPlatformId.get(
                `activecampaign:${action.targetId}`
              );
              if (target) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: target.id,
                  edgeType: "triggers",
                  label: "ends",
                  metadata: { blockId: action.blockId, action: "end" },
                });
              }
              break;
            }

            case "send_email": {
              const campaign = byPlatformId.get(
                `activecampaign:${action.targetId}`
              );
              if (campaign) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: campaign.id,
                  edgeType: "sends_email",
                  label: "sends",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }

            case "add_to_list": {
              const list = byPlatformId.get(
                `activecampaign:${action.targetId}`
              );
              if (list) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: list.id,
                  edgeType: "adds_to_list",
                  label: "subscribes to",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }

            case "move_to_stage": {
              const stage = byPlatformId.get(
                `activecampaign:${action.targetId}`
              );
              if (stage) {
                edges.push({
                  accountId: node.accountId,
                  sourceNodeId: node.id,
                  targetNodeId: stage.id,
                  edgeType: "moves_to_stage",
                  label: "moves to",
                  metadata: { blockId: action.blockId },
                });
              }
              break;
            }
          }
        }
      }
    }

    // ---- Priority 2: Config-derived edges ----

    // Campaign → Automation (sends_email)
    if (
      node.nodeType === "email_campaign" &&
      node.platform === "activecampaign"
    ) {
      const automationId = node.config.automationId as string | null;
      if (automationId) {
        const automation = byPlatformId.get(
          `activecampaign:${automationId}`
        );
        if (automation) {
          edges.push({
            accountId: node.accountId,
            sourceNodeId: automation.id,
            targetNodeId: node.id,
            edgeType: "sends_email",
            label: "sends",
            metadata: {},
          });
        }
      }
    }

    // Price → Product
    if (node.nodeType === "price" && node.platform === "stripe") {
      const productId = node.config.productId as string | null;
      if (productId) {
        const product = byPlatformId.get(`stripe:${productId}`);
        if (product) {
          edges.push({
            accountId: node.accountId,
            sourceNodeId: product.id,
            targetNodeId: node.id,
            edgeType: "creates_customer",
            label: "has price",
            metadata: {},
          });
        }
      }
    }

    // Pipeline Stage → Pipeline
    if (
      node.nodeType === "pipeline_stage" &&
      node.platform === "activecampaign" &&
      !node.config.isPipeline
    ) {
      const pipelineId = node.config.pipelineId as string | null;
      if (pipelineId) {
        const pipeline = byPlatformId.get(
          `activecampaign:${pipelineId}`
        );
        if (pipeline) {
          edges.push({
            accountId: node.accountId,
            sourceNodeId: pipeline.id,
            targetNodeId: node.id,
            edgeType: "moves_to_stage",
            label: `stage ${node.config.order ?? ""}`.trim(),
            metadata: { order: node.config.order },
          });
        }
      }
    }

    // ---- Priority 3: Zapier cross-platform ----
    if (node.nodeType === "zap" && node.platform === "zapier") {
      const steps = node.config.steps as
        | Array<{ action: string; title: string; appSlug: string }>
        | undefined;
      if (steps) {
        for (const step of steps) {
          if (
            step.appSlug?.includes("activecampaign") ||
            step.appSlug?.includes("active-campaign")
          ) {
            const match = nodes.find(
              (n) =>
                n.platform === "activecampaign" &&
                n.nodeType === "automation" &&
                step.title &&
                n.name.toLowerCase().includes(step.title.toLowerCase())
            );
            if (match) {
              edges.push({
                accountId: node.accountId,
                sourceNodeId: node.id,
                targetNodeId: match.id,
                edgeType: "triggers",
                label: "triggers",
                metadata: { stepTitle: step.title },
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.sourceNodeId}:${edge.targetNodeId}:${edge.edgeType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Resolve a block action's target to a FlowNode.
 * Tries platformId first, then falls back to name matching.
 */
function resolveTarget(
  platform: string,
  nodeType: string,
  action: BlockAction,
  byPlatformId: Map<string, FlowNode>,
  tagsByName: Map<string, FlowNode>
): FlowNode | undefined {
  // Try by platform ID first
  if (action.targetId) {
    const node = byPlatformId.get(`${platform}:${action.targetId}`);
    if (node) return node;
  }

  // Fall back to name matching for tags
  if (nodeType === "tag" && action.targetName) {
    return tagsByName.get(action.targetName.toLowerCase());
  }

  return undefined;
}

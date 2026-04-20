import type { FlowNode, FlowEdge, EdgeType } from "@/types/unified";

interface InferredEdge {
  accountId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  label: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Infer edges from node config data.
 *
 * Relationships we can detect:
 * 1. AC email_campaign → automation  (campaign.config.automationId)
 * 2. Stripe price → product          (price.config.productId)
 * 3. AC pipeline_stage → pipeline    (stage.config.pipelineId)
 * 4. Zapier zap → AC/Stripe nodes    (zap.config.steps matching platform apps)
 */
export function inferEdges(nodes: FlowNode[]): InferredEdge[] {
  const edges: InferredEdge[] = [];

  // Build lookup maps: platform + platformId → node
  const byPlatformId = new Map<string, FlowNode>();
  for (const node of nodes) {
    byPlatformId.set(`${node.platform}:${node.platformId}`, node);
  }

  for (const node of nodes) {
    // 1. Campaign → Automation (sends_email)
    if (node.nodeType === "email_campaign" && node.platform === "activecampaign") {
      const automationId = node.config.automationId as string | null;
      if (automationId) {
        const automation = byPlatformId.get(`activecampaign:${automationId}`);
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

    // 2. Price → Product (creates)
    if (node.nodeType === "price" && node.platform === "stripe") {
      const productId = node.config.productId as string | null;
      if (productId) {
        const product = byPlatformId.get(`stripe:${productId}`);
        if (product) {
          edges.push({
            accountId: node.accountId,
            sourceNodeId: product.id,
            targetNodeId: node.id,
            edgeType: "creates_customer", // price belongs to product
            label: "has price",
            metadata: {},
          });
        }
      }
    }

    // 3. Pipeline Stage → Pipeline (moves_to_stage)
    if (
      node.nodeType === "pipeline_stage" &&
      node.platform === "activecampaign" &&
      !node.config.isPipeline
    ) {
      const pipelineId = node.config.pipelineId as string | null;
      if (pipelineId) {
        const pipeline = byPlatformId.get(`activecampaign:${pipelineId}`);
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

    // 4. Zapier zap → connected platform nodes
    if (node.nodeType === "zap" && node.platform === "zapier") {
      const steps = node.config.steps as
        | Array<{ action: string; title: string; appSlug: string }>
        | undefined;

      if (steps && steps.length > 0) {
        // Chain zap steps: step[0] → step[1] → step[2] etc.
        // But we don't have individual step nodes — the zap IS the node.
        // Instead, look for cross-platform connections:
        // If a step references "activecampaign" or "stripe", try to match.
        const connectedApps = node.config.connectedApps as string[] | undefined;
        if (connectedApps) {
          for (const app of connectedApps) {
            const slug = app.toLowerCase();
            if (slug.includes("activecampaign") || slug.includes("active-campaign")) {
              // Find AC automations — link zap as triggering them
              // This is a best-effort heuristic; step title may name the automation
              for (const step of steps) {
                if (
                  step.appSlug?.includes("activecampaign") ||
                  step.appSlug?.includes("active-campaign")
                ) {
                  // Try to find matching automation by name substring
                  const matchingAutomation = nodes.find(
                    (n) =>
                      n.platform === "activecampaign" &&
                      n.nodeType === "automation" &&
                      step.title &&
                      n.name.toLowerCase().includes(step.title.toLowerCase())
                  );
                  if (matchingAutomation) {
                    edges.push({
                      accountId: node.accountId,
                      sourceNodeId: node.id,
                      targetNodeId: matchingAutomation.id,
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
      }
    }
  }

  // Deduplicate edges (same source + target + type)
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.sourceNodeId}:${edge.targetNodeId}:${edge.edgeType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

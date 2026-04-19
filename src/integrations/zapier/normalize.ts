import type { ZapierZapV2 } from "./types";
import type { FlowNode } from "@/types/unified";

export function normalizeZap(zap: ZapierZapV2, accountId: string): FlowNode {
  // Extract app names from step actions (format: "app_slug.trigger_key")
  const connectedApps = zap.steps.map((step) => {
    const appSlug = step.action?.split(".")[0] ?? "unknown";
    return step.app?.title ?? appSlug;
  });

  const triggerApp = connectedApps[0] ?? "Unknown";
  const actionApps = connectedApps.slice(1);

  return {
    id: "",
    accountId,
    platform: "zapier",
    platformId: zap.id,
    nodeType: "zap",
    name: zap.title || `${triggerApp} → ${actionApps.join(" → ") || "Unknown"}`,
    status: zap.is_enabled ? "active" : "inactive",
    config: {
      steps: zap.steps.map((step) => ({
        action: step.action,
        title: step.title,
        appSlug: step.action?.split(".")[0] ?? null,
      })),
      connectedApps,
      lastSuccessfulRunDate: zap.last_successful_run_date,
      editorUrl: zap.links?.html_editor ?? null,
    },
    createdAt: zap.updated_at,
    updatedAt: zap.updated_at,
  };
}

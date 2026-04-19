import { ZapierClient } from "./client";
import { normalizeZap } from "./normalize";
import type { FlowNode } from "@/types/unified";

interface SyncConfigResult {
  nodes: FlowNode[];
  errors: Array<{ operation: string; message: string }>;
}

export async function syncConfig(
  client: ZapierClient,
  accountId: string
): Promise<SyncConfigResult> {
  const nodes: FlowNode[] = [];
  const errors: Array<{ operation: string; message: string }> = [];

  try {
    const zaps = await client.getZaps();
    for (const zap of zaps) {
      nodes.push(normalizeZap(zap, accountId));
    }
  } catch (err) {
    errors.push({
      operation: "getZaps",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }

  return { nodes, errors };
}

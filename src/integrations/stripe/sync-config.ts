import { StripeClient } from "./client";
import {
  normalizeProduct,
  normalizePrice,
  normalizeWebhookEndpoint,
} from "./normalize";
import type { FlowNode } from "@/types/unified";

interface SyncConfigResult {
  nodes: FlowNode[];
  errors: Array<{ operation: string; message: string }>;
}

export async function syncConfig(
  client: StripeClient,
  accountId: string
): Promise<SyncConfigResult> {
  const nodes: FlowNode[] = [];
  const errors: Array<{ operation: string; message: string }> = [];

  const [products, prices, webhooks] = await Promise.allSettled([
    client.getProducts(),
    client.getPrices(),
    client.getWebhookEndpoints(),
  ]);

  if (products.status === "fulfilled") {
    for (const p of products.value) {
      nodes.push(normalizeProduct(p, accountId));
    }
  } else {
    errors.push({
      operation: "getProducts",
      message: products.reason?.message ?? "Unknown error",
    });
  }

  if (prices.status === "fulfilled") {
    for (const p of prices.value) {
      nodes.push(normalizePrice(p, accountId));
    }
  } else {
    errors.push({
      operation: "getPrices",
      message: prices.reason?.message ?? "Unknown error",
    });
  }

  if (webhooks.status === "fulfilled") {
    for (const w of webhooks.value) {
      nodes.push(normalizeWebhookEndpoint(w, accountId));
    }
  } else {
    errors.push({
      operation: "getWebhookEndpoints",
      message: webhooks.reason?.message ?? "Unknown error",
    });
  }

  return { nodes, errors };
}

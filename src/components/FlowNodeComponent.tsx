"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

interface FlowNodeData {
  label: string;
  platform: string;
  nodeType: string;
  status: string | null;
  color: string;
  icon: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

function getStatLine(
  nodeType: string,
  config?: Record<string, unknown>
): string | null {
  if (!config) return null;

  switch (nodeType) {
    case "email_campaign": {
      const sends = config.sendCount as number | undefined;
      const opens = config.opens as number | undefined;
      if (sends && sends > 0) {
        const rate = opens && sends ? Math.round((opens / sends) * 100) : 0;
        return `${sends.toLocaleString()} sent \u00b7 ${rate}% opened`;
      }
      return null;
    }
    case "tag": {
      const count = config.subscriberCount as number | undefined;
      return count ? `${count.toLocaleString()} subscribers` : null;
    }
    case "list": {
      const count = config.subscriberCount as number | undefined;
      return count ? `${count.toLocaleString()} subscribers` : null;
    }
    case "automation": {
      const entered = config.entered as number | undefined;
      return entered ? `${entered.toLocaleString()} entered` : null;
    }
    case "price": {
      const amount = config.unitAmount as number | undefined;
      const currency = config.currency as string | undefined;
      if (amount) {
        return `${(amount / 100).toFixed(2)} ${(currency ?? "usd").toUpperCase()}`;
      }
      return null;
    }
    default:
      return null;
  }
}

export function FlowNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData;
  const isActive = nodeData.status === "active" || nodeData.status === null;
  const statLine = getStatLine(nodeData.nodeType, nodeData.config);

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-md"
      style={{
        background: "#18181b",
        borderColor: `${nodeData.color}66`,
        borderWidth: 1,
        minWidth: 240,
        maxWidth: 256,
        opacity: isActive ? 1 : 0.6,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: nodeData.color }}
      />

      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
          style={{ background: nodeData.color }}
        >
          {nodeData.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">
            {nodeData.label}
          </p>
          <p className="text-[10px] text-zinc-500">
            {nodeData.nodeType.replace(/_/g, " ")}
            {nodeData.status && nodeData.status !== "active" && !isActive
              ? ` \u00b7 ${nodeData.status}`
              : ""}
          </p>
          {statLine && (
            <p className="text-[10px] text-zinc-400">{statLine}</p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: nodeData.color }}
      />
    </div>
  );
}

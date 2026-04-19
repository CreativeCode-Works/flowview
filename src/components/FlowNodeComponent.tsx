"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

interface FlowNodeData {
  label: string;
  platform: string;
  nodeType: string;
  status: string | null;
  color: string;
  icon: string;
  [key: string]: unknown;
}

export function FlowNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as FlowNodeData;
  const isActive = nodeData.status === "active";

  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{
        background: "#18181b",
        borderColor: nodeData.color,
        borderWidth: 2,
        minWidth: 180,
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
          className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
          style={{ background: nodeData.color }}
        >
          {nodeData.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">
            {nodeData.label}
          </p>
          <p className="text-[10px] text-zinc-500">
            {nodeData.platform} · {nodeData.nodeType}
            {!isActive && " · inactive"}
          </p>
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

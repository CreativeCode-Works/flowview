"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ClusterNodeData {
  label: string;
  platform: string;
  nodeType: string;
  childCount: number;
  isExpanded: boolean;
  color: string;
  icon: string;
  parentNodeId: string | null;
  parentStatus: string | null;
  [key: string]: unknown;
}

export function ClusterNodeComponent({ data }: NodeProps) {
  const d = data as unknown as ClusterNodeData;
  const isActive = d.parentStatus === "active" || d.parentStatus === null;

  return (
    <div
      className="rounded-lg border shadow-lg"
      style={{
        background: "#0a0a0a",
        borderColor: d.color,
        borderWidth: 1,
        opacity: isActive ? 1 : 0.7,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: d.color }}
      />

      {/* Cluster header — always visible */}
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2"
        style={{
          borderBottom: d.isExpanded ? `1px solid ${d.color}33` : "none",
          background: `${d.color}15`,
        }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
          style={{ background: d.color }}
        >
          {d.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{d.label}</p>
          <p className="text-[10px] text-zinc-500">
            {d.childCount} item{d.childCount !== 1 ? "s" : ""}
            {" \u00b7 "}
            {d.isExpanded ? "click to collapse" : "click to expand"}
          </p>
        </div>
        <span className="text-[10px] text-zinc-500">
          {d.isExpanded ? "\u25B2" : "\u25BC"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: d.color }}
      />
    </div>
  );
}

"use client";

import { useCallback } from "react";
import type { FlowNode, Platform, NodeType } from "@/types/unified";
import { PLATFORM_COLORS, NODE_TYPE_ICONS } from "./FlowGraph";

export interface GraphFilters {
  platforms: Set<Platform>;
  nodeTypes: Set<NodeType>;
  statusFilter: "all" | "active" | "inactive";
  search: string;
}

interface GraphToolbarProps {
  nodes: FlowNode[];
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;
  clusterCount: number;
  visibleNodeCount: number;
}

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "activecampaign", label: "AC" },
  { id: "zapier", label: "Zapier" },
  { id: "stripe", label: "Stripe" },
];

const NODE_TYPES: { id: NodeType; label: string }[] = [
  { id: "automation", label: "Automations" },
  { id: "email_campaign", label: "Campaigns" },
  { id: "tag", label: "Tags" },
  { id: "list", label: "Lists" },
  { id: "webhook", label: "Webhooks" },
  { id: "zap", label: "Zaps" },
  { id: "product", label: "Products" },
  { id: "price", label: "Prices" },
  { id: "pipeline_stage", label: "Pipelines" },
  { id: "form", label: "Forms" },
  { id: "subscription_plan", label: "Plans" },
];

export function GraphToolbar({
  nodes,
  filters,
  onFiltersChange,
  clusterCount,
  visibleNodeCount,
}: GraphToolbarProps) {
  const togglePlatform = useCallback(
    (platform: Platform) => {
      const next = new Set(filters.platforms);
      if (next.has(platform)) {
        if (next.size > 1) next.delete(platform);
      } else {
        next.add(platform);
      }
      onFiltersChange({ ...filters, platforms: next });
    },
    [filters, onFiltersChange]
  );

  const toggleNodeType = useCallback(
    (nodeType: NodeType) => {
      const next = new Set(filters.nodeTypes);
      if (next.has(nodeType)) {
        if (next.size > 1) next.delete(nodeType);
      } else {
        next.add(nodeType);
      }
      onFiltersChange({ ...filters, nodeTypes: next });
    },
    [filters, onFiltersChange]
  );

  // Only show node types that exist in the data
  const presentTypes = new Set(nodes.map((n) => n.nodeType));
  const visibleNodeTypes = NODE_TYPES.filter((t) => presentTypes.has(t.id));

  // Only show platforms that exist in the data
  const presentPlatforms = new Set(nodes.map((n) => n.platform));
  const visiblePlatforms = PLATFORMS.filter((p) =>
    presentPlatforms.has(p.id)
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search nodes..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="h-8 w-48 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-zinc-700" />

      {/* Platform toggles */}
      <div className="flex gap-1">
        {visiblePlatforms.map(({ id, label }) => {
          const count = nodes.filter((n) => n.platform === id).length;
          const active = filters.platforms.has(id);
          return (
            <button
              key={id}
              onClick={() => togglePlatform(id)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
              style={{
                background: active ? `${PLATFORM_COLORS[id]}22` : "transparent",
                color: active ? PLATFORM_COLORS[id] : "#71717a",
                border: `1px solid ${active ? `${PLATFORM_COLORS[id]}44` : "#27272a"}`,
              }}
            >
              {label}
              <span className="text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-zinc-700" />

      {/* Node type filters */}
      <div className="flex flex-wrap gap-1">
        {visibleNodeTypes.map(({ id, label }) => {
          const active = filters.nodeTypes.has(id);
          return (
            <button
              key={id}
              onClick={() => toggleNodeType(id)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors"
              style={{
                background: active ? "#27272a" : "transparent",
                color: active ? "#e4e4e7" : "#52525b",
                border: `1px solid ${active ? "#3f3f46" : "transparent"}`,
              }}
            >
              <span className="font-mono text-[10px]">
                {NODE_TYPE_ICONS[id]}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-zinc-700" />

      {/* Status filter */}
      <select
        value={filters.statusFilter}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            statusFilter: e.target.value as "all" | "active" | "inactive",
          })
        }
        className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs text-white outline-none"
      >
        <option value="all">All statuses</option>
        <option value="active">Active only</option>
        <option value="inactive">Inactive only</option>
      </select>

      {/* Stats */}
      <div className="ml-auto text-[11px] text-zinc-500">
        {visibleNodeCount} nodes in {clusterCount} groups
      </div>
    </div>
  );
}

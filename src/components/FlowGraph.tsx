"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FlowNode, FlowEdge, Platform, NodeType } from "@/types/unified";
import { FlowNodeComponent } from "./FlowNodeComponent";
import { ClusterNodeComponent } from "./ClusterNodeComponent";
import { GraphToolbar, type GraphFilters } from "./GraphToolbar";

interface FlowGraphProps {
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  activecampaign: "#2563eb",
  zapier: "#f97316",
  stripe: "#7c3aed",
};

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  automation: "A",
  zap: "Z",
  product: "P",
  tag: "T",
  webhook: "W",
  pipeline_stage: "S",
  email_campaign: "E",
  form: "F",
  list: "L",
  price: "$",
  subscription_plan: "S",
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  automation: "Automations",
  zap: "Zaps",
  product: "Products",
  tag: "Tags",
  webhook: "Webhooks",
  pipeline_stage: "Pipeline Stages",
  email_campaign: "Email Campaigns",
  form: "Forms",
  list: "Lists",
  price: "Prices",
  subscription_plan: "Plans",
};

const nodeTypes = {
  flowNode: FlowNodeComponent,
  clusterNode: ClusterNodeComponent,
};

// ---- Clustering logic ----

interface Cluster {
  id: string;
  label: string;
  platform: Platform;
  parentNode: FlowNode | null; // e.g. the automation that owns these campaigns
  children: FlowNode[];
  nodeType: NodeType;
}

/**
 * Group nodes into logical clusters:
 * 1. Automations + their linked email campaigns (via edges)
 * 2. Products + their prices (via edges)
 * 3. Pipelines + their stages (via edges)
 * 4. Remaining nodes grouped by type within platform
 */
function buildClusters(
  nodes: FlowNode[],
  edges: FlowEdge[]
): { clusters: Cluster[]; orphanNodes: FlowNode[] } {
  const clusters: Cluster[] = [];
  const clusteredIds = new Set<string>();

  // Build edge lookup: source → targets
  const childrenOf = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = childrenOf.get(edge.sourceNodeId) ?? [];
    existing.push(edge.targetNodeId);
    childrenOf.set(edge.sourceNodeId, existing);
  }

  const nodeById = new Map<string, FlowNode>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
  }

  // 1. Automation clusters (automation + its email campaigns)
  const automations = nodes.filter(
    (n) => n.nodeType === "automation" && n.platform === "activecampaign"
  );
  for (const auto of automations) {
    const childIds = childrenOf.get(auto.id) ?? [];
    const children = childIds
      .map((id) => nodeById.get(id))
      .filter((n): n is FlowNode => n !== undefined);

    if (children.length > 0) {
      clusters.push({
        id: `cluster-auto-${auto.id}`,
        label: auto.name,
        platform: auto.platform,
        parentNode: auto,
        children,
        nodeType: "automation",
      });
      clusteredIds.add(auto.id);
      for (const child of children) clusteredIds.add(child.id);
    }
  }

  // 2. Product clusters (product + prices)
  const products = nodes.filter(
    (n) => n.nodeType === "product" && n.platform === "stripe"
  );
  for (const product of products) {
    const childIds = childrenOf.get(product.id) ?? [];
    const children = childIds
      .map((id) => nodeById.get(id))
      .filter((n): n is FlowNode => n !== undefined);

    if (children.length > 0) {
      clusters.push({
        id: `cluster-prod-${product.id}`,
        label: product.name,
        platform: product.platform,
        parentNode: product,
        children,
        nodeType: "product",
      });
      clusteredIds.add(product.id);
      for (const child of children) clusteredIds.add(child.id);
    }
  }

  // 3. Pipeline clusters (pipeline + stages)
  const pipelines = nodes.filter(
    (n) =>
      n.nodeType === "pipeline_stage" &&
      n.platform === "activecampaign" &&
      n.config.isPipeline === true
  );
  for (const pipeline of pipelines) {
    const childIds = childrenOf.get(pipeline.id) ?? [];
    const children = childIds
      .map((id) => nodeById.get(id))
      .filter((n): n is FlowNode => n !== undefined);

    if (children.length > 0) {
      clusters.push({
        id: `cluster-pipe-${pipeline.id}`,
        label: pipeline.name,
        platform: pipeline.platform,
        parentNode: pipeline,
        children,
        nodeType: "pipeline_stage",
      });
      clusteredIds.add(pipeline.id);
      for (const child of children) clusteredIds.add(child.id);
    }
  }

  // Remaining unclustered nodes — group by platform + nodeType
  const remaining = nodes.filter((n) => !clusteredIds.has(n.id));
  const buckets = new Map<string, FlowNode[]>();
  for (const node of remaining) {
    const key = `${node.platform}:${node.nodeType}`;
    const existing = buckets.get(key) ?? [];
    existing.push(node);
    buckets.set(key, existing);
  }

  for (const [key, bucketNodes] of buckets) {
    const [platform, nodeType] = key.split(":") as [Platform, NodeType];
    clusters.push({
      id: `cluster-orphan-${key}`,
      label: `${NODE_TYPE_LABELS[nodeType] ?? nodeType} (unlinked)`,
      platform,
      parentNode: null,
      children: bucketNodes,
      nodeType,
    });
  }

  return { clusters, orphanNodes: [] };
}

// ---- Layout ----

const CLUSTER_WIDTH = 280;
const CLUSTER_HEADER = 56;
const NODE_HEIGHT = 64;
const NODE_GAP = 8;
const CLUSTER_PADDING = 12;
const CLUSTER_GAP_X = 40;
const CLUSTER_GAP_Y = 30;
const COLUMNS_PER_PLATFORM = 3;

function layoutClusters(
  clusters: Cluster[],
  expandedClusters: Set<string>
): { nodes: Node[]; maxY: number } {
  const nodes: Node[] = [];

  // Group clusters by platform
  const platformClusters = new Map<Platform, Cluster[]>();
  for (const cluster of clusters) {
    const existing = platformClusters.get(cluster.platform) ?? [];
    existing.push(cluster);
    platformClusters.set(cluster.platform, existing);
  }

  // Sort platforms consistently
  const platformOrder: Platform[] = ["activecampaign", "zapier", "stripe"];
  let globalXOffset = 0;
  let maxY = 0;

  for (const platform of platformOrder) {
    const pClusters = platformClusters.get(platform);
    if (!pClusters || pClusters.length === 0) continue;

    // Sort: connected clusters first (have parentNode), then orphan buckets
    pClusters.sort((a, b) => {
      if (a.parentNode && !b.parentNode) return -1;
      if (!a.parentNode && b.parentNode) return 1;
      return b.children.length - a.children.length;
    });

    // Lay out in multi-column grid within the platform section
    const colPositions: number[] = [];
    const colHeights: number[] = [];
    for (let i = 0; i < COLUMNS_PER_PLATFORM; i++) {
      colPositions.push(globalXOffset + i * (CLUSTER_WIDTH + CLUSTER_GAP_X));
      colHeights.push(0);
    }

    for (const cluster of pClusters) {
      const isExpanded = expandedClusters.has(cluster.id);
      const visibleCount = isExpanded ? cluster.children.length : 0;
      const clusterHeight =
        CLUSTER_HEADER +
        (isExpanded
          ? visibleCount * (NODE_HEIGHT + NODE_GAP) + CLUSTER_PADDING * 2
          : 0);

      // Place in shortest column
      let shortestCol = 0;
      for (let i = 1; i < colHeights.length; i++) {
        if (colHeights[i] < colHeights[shortestCol]) shortestCol = i;
      }

      const x = colPositions[shortestCol];
      const y = colHeights[shortestCol];

      // Add cluster node
      nodes.push({
        id: cluster.id,
        type: "clusterNode",
        position: { x, y },
        data: {
          label: cluster.label,
          platform: cluster.platform,
          nodeType: cluster.nodeType,
          childCount: cluster.children.length,
          isExpanded,
          color: PLATFORM_COLORS[cluster.platform],
          icon: NODE_TYPE_ICONS[cluster.nodeType] ?? "?",
          parentNodeId: cluster.parentNode?.id ?? null,
          parentStatus: cluster.parentNode?.status ?? null,
        },
        style: {
          width: CLUSTER_WIDTH,
          height: clusterHeight,
        },
      });

      // If expanded, place child nodes inside
      if (isExpanded) {
        let childY = CLUSTER_HEADER + CLUSTER_PADDING;
        for (const child of cluster.children) {
          nodes.push({
            id: child.id,
            type: "flowNode",
            position: { x: CLUSTER_PADDING, y: childY },
            parentId: cluster.id,
            extent: "parent" as const,
            data: {
              label: child.name,
              platform: child.platform,
              nodeType: child.nodeType,
              status: child.status,
              color: PLATFORM_COLORS[child.platform],
              icon: NODE_TYPE_ICONS[child.nodeType] ?? "?",
              config: child.config,
            },
          });
          childY += NODE_HEIGHT + NODE_GAP;
        }
      }

      colHeights[shortestCol] = y + clusterHeight + CLUSTER_GAP_Y;
      maxY = Math.max(maxY, colHeights[shortestCol]);
    }

    // Advance X offset for next platform
    const platformWidth =
      COLUMNS_PER_PLATFORM * (CLUSTER_WIDTH + CLUSTER_GAP_X);
    globalXOffset += platformWidth + 60;
  }

  return { nodes, maxY };
}

function convertEdges(
  flowEdges: FlowEdge[],
  visibleNodeIds: Set<string>
): Edge[] {
  return flowEdges
    .filter(
      (edge) =>
        visibleNodeIds.has(edge.sourceNodeId) &&
        visibleNodeIds.has(edge.targetNodeId)
    )
    .map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      label: edge.label ?? edge.edgeType,
      animated: true,
      style: { stroke: "#525252" },
      labelStyle: { fill: "#a1a1aa", fontSize: 10 },
    }));
}

function applyFilters(nodes: FlowNode[], filters: GraphFilters): FlowNode[] {
  return nodes.filter((node) => {
    if (!filters.platforms.has(node.platform)) return false;
    if (!filters.nodeTypes.has(node.nodeType)) return false;
    if (filters.statusFilter === "active" && node.status !== "active")
      return false;
    if (filters.statusFilter === "inactive" && node.status === "active")
      return false;
    if (
      filters.search &&
      !node.name.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });
}

export function FlowGraph({ flowNodes, flowEdges }: FlowGraphProps) {
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set()
  );
  const [filters, setFilters] = useState<GraphFilters>({
    platforms: new Set<Platform>(["activecampaign", "zapier", "stripe"]),
    nodeTypes: new Set<NodeType>([
      "automation",
      "zap",
      "product",
      "tag",
      "webhook",
      "pipeline_stage",
      "email_campaign",
      "form",
      "list",
      "price",
      "subscription_plan",
    ]),
    statusFilter: "all",
    search: "",
  });

  const filteredNodes = useMemo(
    () => applyFilters(flowNodes, filters),
    [flowNodes, filters]
  );

  const { clusters } = useMemo(
    () => buildClusters(filteredNodes, flowEdges),
    [filteredNodes, flowEdges]
  );

  const { nodes: layoutedNodes } = useMemo(
    () => layoutClusters(clusters, expandedClusters),
    [clusters, expandedClusters]
  );

  const visibleNodeIds = useMemo(
    () => new Set(layoutedNodes.map((n) => n.id)),
    [layoutedNodes]
  );

  const layoutedEdges = useMemo(
    () => convertEdges(flowEdges, visibleNodeIds),
    [flowEdges, visibleNodeIds]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "clusterNode") {
        setExpandedClusters((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) {
            next.delete(node.id);
          } else {
            next.add(node.id);
          }
          return next;
        });
      }
    },
    []
  );

  // Re-sync nodes/edges when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  if (flowNodes.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <p className="text-sm text-zinc-400">
          Connect your tools and run a sync to see your flow graph.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <GraphToolbar
        nodes={flowNodes}
        filters={filters}
        onFiltersChange={setFilters}
        clusterCount={clusters.length}
        visibleNodeCount={filteredNodes.length}
      />
      <div className="h-[calc(100vh-220px)] min-h-[500px] rounded-xl border border-zinc-800 bg-zinc-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#27272a" gap={20} />
          <Controls
            style={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 8,
            }}
          />
          <MiniMap
            style={{ background: "#18181b", border: "1px solid #27272a" }}
            nodeColor={(node) => (node.data?.color as string) ?? "#525252"}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useMemo } from "react";
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

interface FlowGraphProps {
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}

const PLATFORM_COLORS: Record<Platform, string> = {
  activecampaign: "#2563eb",
  zapier: "#f97316",
  stripe: "#7c3aed",
};

const NODE_TYPE_ICONS: Record<NodeType, string> = {
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

const nodeTypes = {
  flowNode: FlowNodeComponent,
};

function layoutNodes(flowNodes: FlowNode[]): Node[] {
  // Group by platform, then lay out in columns
  const platformGroups = new Map<Platform, FlowNode[]>();
  for (const node of flowNodes) {
    const existing = platformGroups.get(node.platform) ?? [];
    existing.push(node);
    platformGroups.set(node.platform, existing);
  }

  const nodes: Node[] = [];
  let colIndex = 0;

  for (const [platform, groupNodes] of platformGroups) {
    const x = colIndex * 300;
    let y = 0;

    for (const flowNode of groupNodes) {
      nodes.push({
        id: flowNode.id,
        type: "flowNode",
        position: { x, y },
        data: {
          label: flowNode.name,
          platform,
          nodeType: flowNode.nodeType,
          status: flowNode.status,
          color: PLATFORM_COLORS[platform],
          icon: NODE_TYPE_ICONS[flowNode.nodeType] ?? "?",
        },
      });
      y += 100;
    }

    colIndex++;
  }

  return nodes;
}

function convertEdges(flowEdges: FlowEdge[]): Edge[] {
  return flowEdges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    label: edge.label ?? edge.edgeType,
    animated: true,
    style: { stroke: "#525252" },
    labelStyle: { fill: "#a1a1aa", fontSize: 10 },
  }));
}

export function FlowGraph({ flowNodes, flowEdges }: FlowGraphProps) {
  const initialNodes = useMemo(() => layoutNodes(flowNodes), [flowNodes]);
  const initialEdges = useMemo(() => convertEdges(flowEdges), [flowEdges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onInit = useCallback(() => {
    // Graph is ready
  }, []);

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
    <div className="h-[600px] rounded-xl border border-zinc-800 bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
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
  );
}

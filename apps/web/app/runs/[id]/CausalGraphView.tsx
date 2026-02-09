"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import type { CausalGraph } from "@faultline/shared";

function layoutNodes(
  nodes: CausalGraph["nodes"],
  firstDivergence?: string,
): Node[] {
  const step = 200;
  return nodes.map((n, i) => ({
    id: n.id,
    type: "default",
    data: {
      label: n.label,
      style: firstDivergence === n.id ? { border: "2px solid #f59e0b" } : {},
    },
    position: { x: (i % 3) * step, y: Math.floor(i / 3) * step },
    style:
      firstDivergence === n.id
        ? {
            border: "2px solid #f59e0b",
            borderRadius: "8px",
            background: "#fef3c7",
            color: "#92400e",
          }
        : {},
  }));
}

function InnerGraph({ graph }: { graph: CausalGraph }) {
  const initialNodes = layoutNodes(graph.nodes, graph.first_divergence_node_id);
  const initialEdges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    style:
      e.type === "contradicts"
        ? { stroke: "#ef4444", strokeWidth: 2 }
        : e.type === "leads_to"
          ? { stroke: "#f59e0b", strokeWidth: 2 }
          : {},
    label:
      e.type === "contradicts"
        ? "contradicts"
        : e.type === "leads_to"
          ? "→"
          : "",
  }));
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge(params, eds)),
    [setEdges],
  );

  if (graph.nodes.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">No graph data yet.</p>;
  }

  return (
    <div className="h-[320px] w-full rounded border border-zinc-700 bg-zinc-900">
      {graph.first_divergence_node_id && (
        <p className="mb-2 text-xs text-amber-400">
          First divergence:{" "}
          {
            graph.nodes.find((n) => n.id === graph.first_divergence_node_id)
              ?.label
          }
        </p>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap nodeColor="#71717a" maskColor="rgba(0,0,0,0.8)" />
      </ReactFlow>
    </div>
  );
}

export function CausalGraphView({ graph }: { graph: CausalGraph }) {
  return (
    <ReactFlowProvider>
      <InnerGraph graph={graph} />
    </ReactFlowProvider>
  );
}

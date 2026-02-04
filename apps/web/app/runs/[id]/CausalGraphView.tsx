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

function layoutNodes(nodes: CausalGraph["nodes"]): Node[] {
  const step = 180;
  return nodes.map((n, i) => ({
    id: n.id,
    type: "default",
    data: { label: n.label },
    position: { x: (i % 3) * step, y: Math.floor(i / 3) * step },
  }));
}

function InnerGraph({ graph }: { graph: CausalGraph }) {
  const initialNodes = layoutNodes(graph.nodes);
  const initialEdges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
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
    <div className="h-[280px] w-full rounded border border-zinc-700 bg-zinc-900">
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

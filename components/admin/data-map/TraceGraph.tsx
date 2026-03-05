import { useEffect, useState } from 'react';

import { Spin } from 'antd';
import type { Node } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { TraceResponse } from './graphLayout';
import { buildTraceGraph } from './graphLayout';
import { NodeDrawer } from './NodeDrawer';

interface TraceGraphProps {
  selectedId: string;
}

export function TraceGraph({ selectedId }: TraceGraphProps) {
  const { data, isLoading } = useSWR<TraceResponse>('/api/admin/data-map/periods/' + selectedId + '/trace');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!data) return;
    const { nodes: n, edges: e } = buildTraceGraph(data);
    setNodes(n);
    setEdges(e);
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setDrawerNode(node)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <NodeDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
    </div>
  );
}

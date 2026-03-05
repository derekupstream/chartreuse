import { useEffect, useState } from 'react';

import { Badge, Spin } from 'antd';
import { useRouter } from 'next/router';
import type { Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { TraceResponse } from './graphLayout';
import { buildTraceGraph } from './graphLayout';
import { NodeDrawer } from './NodeDrawer';

interface TraceGraphProps {
  selectedId: string;
}

function IssueNode({ data }: NodeProps) {
  const router = useRouter();
  const issueCount: number = (data.issueCount as number) ?? 0;
  const hasIssues = issueCount > 0;

  function handleBadgeClick(e: React.MouseEvent) {
    e.stopPropagation(); // Don't open NodeDrawer
    const entityId = data.entityId as string | undefined;
    if (entityId) {
      router.push(`/admin/data-science/inputs?entityId=${entityId}`);
    }
  }

  return (
    <div style={{ padding: '8px 12px', fontSize: 12, textAlign: 'center' }}>
      {hasIssues ? (
        <Badge count={issueCount} style={{ cursor: 'pointer' }} onClick={handleBadgeClick}>
          <span>{data.label as string}</span>
        </Badge>
      ) : (
        <span>{data.label as string}</span>
      )}
    </div>
  );
}

const nodeTypes = { default: IssueNode };

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
        nodeTypes={nodeTypes}
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

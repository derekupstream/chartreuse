import { useEffect, useState } from 'react';

import { Spin, Typography } from 'antd';
import type { Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { ProjectionsTraceResponse } from './projectionsGraphLayout';
import { buildProjectionsGraph } from './projectionsGraphLayout';
import { NodeDrawer } from './NodeDrawer';
import { ProjectsFeedPanel } from './ProjectsFeedPanel';

function IssueNode({ data }: NodeProps) {
  return (
    <div style={{ padding: '8px 12px', fontSize: 12, textAlign: 'center' }}>
      <span>{data.label as string}</span>
    </div>
  );
}

const nodeTypes = { default: IssueNode };

interface Props {
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export function ProjectionsGraph({ selectedProjectId, onSelectProject }: Props) {
  const { data: traceData, isLoading } = useSWR<ProjectionsTraceResponse>(
    selectedProjectId ? `/api/admin/data-map/projections-trace?projectId=${selectedProjectId}` : null
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!traceData) return;
    const { nodes: n, edges: e } = buildProjectionsGraph(traceData);
    setNodes(n);
    setEdges(e);
  }, [traceData]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px - 46px - 46px)', overflow: 'hidden' }}>
      {/* Left feed panel — 38% */}
      <div
        style={{
          width: '38%',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          padding: '16px'
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          All Projects
        </Typography.Title>
        <ProjectsFeedPanel selectedId={selectedProjectId} onSelect={onSelectProject} mode='projections' />
      </div>

      {/* Right graph panel — 62% */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin size='large' />
          </div>
        )}
        {!isLoading && !selectedProjectId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography.Text type='secondary'>Select a project to view its projections trace</Typography.Text>
          </div>
        )}
        {!isLoading && selectedProjectId && traceData && (
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
        )}
      </div>
      <NodeDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
    </div>
  );
}

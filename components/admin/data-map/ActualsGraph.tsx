import { useEffect, useState } from 'react';

import { Select, Space, Spin, Typography } from 'antd';
import type { Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { ActualsTraceResponse } from './actualsGraphLayout';
import { buildActualsGraph } from './actualsGraphLayout';
import { NodeDrawer } from './NodeDrawer';

interface ProjectOption {
  id: string;
  name: string;
  category: string;
}

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

export function ActualsGraph({ selectedProjectId, onSelectProject }: Props) {
  const { data: projectsData } = useSWR<{ projects: ProjectOption[] }>('/api/admin/data-map/projects');
  const { data: traceData, isLoading } = useSWR<ActualsTraceResponse>(
    selectedProjectId ? `/api/admin/data-map/actuals-trace?projectId=${selectedProjectId}` : null
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!traceData) return;
    const { nodes: n, edges: e } = buildActualsGraph(traceData);
    setNodes(n);
    setEdges(e);
  }, [traceData]);

  const projectOptions = (projectsData?.projects ?? []).map(p => ({
    value: p.id,
    label: `${p.name} (${p.category})`
  }));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px - 46px - 46px)', flexDirection: 'column' }}>
      {/* Project selector bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Typography.Text strong>Project:</Typography.Text>
          <Select
            showSearch
            placeholder='Select a project...'
            style={{ width: 320 }}
            options={projectOptions}
            value={selectedProjectId ?? undefined}
            onChange={onSelectProject}
            filterOption={(input, opt) => ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Space>
      </div>
      {/* Graph area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin size='large' />
          </div>
        )}
        {!isLoading && !selectedProjectId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography.Text type='secondary'>Select a project to view its actuals trace</Typography.Text>
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

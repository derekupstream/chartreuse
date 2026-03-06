import { useEffect, useState } from 'react';

import { Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, Handle, MiniMap, Position, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { SystemStatsResponse } from './systemGraphLayout';
import { buildSystemGraph } from './systemGraphLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LAYER_COLORS: Record<string, string> = {
  source: '#1677ff',
  data: '#666',
  governance: '#722ed1',
  processing: '#fa8c16',
  output: '#52c41a'
};

function SystemNode({ data }: NodeProps) {
  const layer = data.layer as string;
  const subtitle = data.subtitle as string | undefined;

  return (
    <>
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ padding: '8px 14px', fontSize: 12, textAlign: 'center', minWidth: 140 }}>
        <div style={{ fontWeight: 600, color: LAYER_COLORS[layer] ?? '#333' }}>{data.label as string}</div>
        {subtitle && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
    </>
  );
}

const nodeTypes = { default: SystemNode };

function SystemNodeDrawer({ node, onClose }: { node: Node | null; onClose: () => void }) {
  if (!node) return <Drawer open={false} onClose={onClose} />;

  const data = node.data as Record<string, unknown>;
  const entity = data.entity as string;
  const count = data.count as number;
  const layer = data.layer as string;
  const runsByStatus = data.runsByStatus as Record<string, number> | undefined;
  const runsByType = data.runsByType as Record<string, number> | undefined;

  const layerLabels: Record<string, string> = {
    source: 'Data Source',
    data: 'Raw Data',
    governance: 'Governance',
    processing: 'Processing',
    output: 'Output'
  };

  return (
    <Drawer open={!!node} onClose={onClose} width={420} title={data.label as string}>
      <Descriptions column={1} size='small' bordered>
        <Descriptions.Item label='Layer'>
          <Tag color={LAYER_COLORS[layer]}>{layerLabels[layer] ?? layer}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label='Entity'>{entity}</Descriptions.Item>
        <Descriptions.Item label='Total Count'>{count.toLocaleString()}</Descriptions.Item>
      </Descriptions>

      {runsByStatus && (
        <>
          <Typography.Title level={5} style={{ marginTop: 20 }}>
            By Status
          </Typography.Title>
          <Descriptions column={1} size='small' bordered>
            {Object.entries(runsByStatus).map(([status, cnt]) => (
              <Descriptions.Item key={status} label={status}>
                {cnt.toLocaleString()}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </>
      )}

      {runsByType && (
        <>
          <Typography.Title level={5} style={{ marginTop: 20 }}>
            By Run Type
          </Typography.Title>
          <Descriptions column={1} size='small' bordered>
            {Object.entries(runsByType).map(([runType, cnt]) => (
              <Descriptions.Item key={runType} label={runType}>
                {cnt.toLocaleString()}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </>
      )}
    </Drawer>
  );
}

export function SystemGraph() {
  const { data, isLoading } = useSWR<SystemStatsResponse>('/api/admin/data-map/system-stats', fetcher);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);

  useEffect(() => {
    if (!data) return;
    const { nodes: n, edges: e } = buildSystemGraph(data);
    setNodes(n);
    setEdges(e);
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 160px)' }}>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px - 46px - 46px)', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setDrawerNode(node)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <SystemNodeDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { Edge, Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, Handle, MiniMap, Position, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { SystemStatsResponse } from './systemGraphLayout';
import { buildSystemGraph, getConnectedEdges, getConnectedPath } from './systemGraphLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LAYER_COLORS: Record<string, string> = {
  source: '#1677ff',
  data: '#666',
  governance: '#722ed1',
  processing: '#fa8c16',
  output: '#52c41a'
};

const HEALTH_COLORS: Record<string, string> = {
  error: '#ff4d4f',
  warning: '#faad14'
};

function SystemNode({ data }: NodeProps) {
  const layer = data.layer as string;
  const subtitle = data.subtitle as string | undefined;
  const signal = data.healthSignal as string | null;
  const severity = data.healthSeverity as string | null;
  const dimmed = data.dimmed as boolean | undefined;

  return (
    <>
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <div
        style={{
          padding: '8px 14px',
          fontSize: 12,
          textAlign: 'center',
          minWidth: 140,
          opacity: dimmed ? 0.25 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        <div style={{ fontWeight: 600, color: LAYER_COLORS[layer] ?? '#333' }}>{data.label as string}</div>
        {subtitle && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{subtitle}</div>}
        {signal && (
          <div style={{ fontSize: 10, color: HEALTH_COLORS[severity ?? 'warning'], marginTop: 3, fontWeight: 500 }}>
            {severity === 'error' ? '\u274C' : '\u26A0\uFE0F'} {signal}
          </div>
        )}
      </div>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
    </>
  );
}

function LabelNode({ data }: NodeProps) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#999',
        textAlign: 'center',
        width: 180
      }}
    >
      {data.label as string}
    </div>
  );
}

const nodeTypes = { default: SystemNode, 'layer-label': LabelNode };

function SystemNodeDrawer({ node, onClose }: { node: Node | null; onClose: () => void }) {
  if (!node) return <Drawer open={false} onClose={onClose} />;

  const data = node.data as Record<string, unknown>;
  const entity = data.entity as string;
  const count = data.count as number;
  const layer = data.layer as string;
  const signal = data.healthSignal as string | null;
  const runsByStatus = data.runsByStatus as Record<string, number> | undefined;
  const runsByType = data.runsByType as Record<string, number> | undefined;

  const layerLabels: Record<string, string> = {
    source: 'Input Data',
    data: 'Raw Data',
    governance: 'Assumptions',
    processing: 'Calculation Engine',
    output: 'Outputs'
  };

  return (
    <Drawer open={!!node} onClose={onClose} width={420} title={data.label as string}>
      <Descriptions column={1} size='small' bordered>
        <Descriptions.Item label='Layer'>
          <Tag color={LAYER_COLORS[layer]}>{layerLabels[layer] ?? layer}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label='Entity'>{entity}</Descriptions.Item>
        <Descriptions.Item label='Total Count'>{count?.toLocaleString() ?? '—'}</Descriptions.Item>
        {signal && (
          <Descriptions.Item label='Health'>
            <Typography.Text type='danger'>{signal}</Typography.Text>
          </Descriptions.Item>
        )}
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Store the raw (un-dimmed) graph
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!data) return;
    const { nodes: n, edges: e } = buildSystemGraph(data);
    setRawNodes(n);
    setRawEdges(e);
  }, [data]);

  // Apply path highlighting when selectedNodeId changes
  const highlightedGraph = useMemo(() => {
    if (!selectedNodeId) {
      return { nodes: rawNodes, edges: rawEdges };
    }

    const connectedNodes = getConnectedPath(selectedNodeId, rawEdges);
    const connectedEdgeIds = getConnectedEdges(connectedNodes, rawEdges);

    const dimmedNodes = rawNodes.map(n => {
      const isLabel = (n.data as Record<string, unknown>).isLabel;
      if (isLabel) return n;
      const isConnected = connectedNodes.has(n.id);
      return {
        ...n,
        data: { ...n.data, dimmed: !isConnected }
      };
    });

    const dimmedEdges = rawEdges.map(e => {
      const isConnected = connectedEdgeIds.has(e.id);
      return {
        ...e,
        animated: isConnected,
        style: {
          ...e.style,
          strokeWidth: isConnected ? 3 : 1,
          opacity: isConnected ? 1 : 0.15
        }
      };
    });

    return { nodes: dimmedNodes, edges: dimmedEdges };
  }, [selectedNodeId, rawNodes, rawEdges]);

  // Sync highlighted graph into ReactFlow state
  useEffect(() => {
    setNodes(highlightedGraph.nodes);
    setEdges(highlightedGraph.edges);
  }, [highlightedGraph]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const isLabel = (node.data as Record<string, unknown>).isLabel;
      if (isLabel) return;

      // Toggle: click same node again to clear selection
      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
        setDrawerNode(null);
      } else {
        setSelectedNodeId(node.id);
        setDrawerNode(node);
      }
    },
    [selectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setDrawerNode(null);
  }, []);

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
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <SystemNodeDrawer
        node={drawerNode}
        onClose={() => {
          setDrawerNode(null);
          setSelectedNodeId(null);
        }}
      />
    </div>
  );
}

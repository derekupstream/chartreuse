import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, Descriptions, Divider, Drawer, List, Spin, Tag, Typography } from 'antd';
import Link from 'next/link';
import type { Edge, Node, NodeProps } from 'reactflow';
import ReactFlow, { Background, Controls, Handle, MiniMap, Position, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { CalcFunctionDetail, SystemStatsResponse } from './systemGraphLayout';
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

// ── Node renderers ──────────────────────────────────────────────

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

// ── Impact path descriptions per node ───────────────────────────

function ImpactPathSection({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <>
      <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
        Impact Paths
      </Divider>
      <Descriptions column={1} size='small' bordered>
        {items.map(item => (
          <Descriptions.Item key={item.label} label={item.label}>
            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </>
  );
}

function ActionLinks({ links }: { links: Array<{ label: string; href: string }> }) {
  return (
    <>
      <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
        Actions
      </Divider>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(link => (
          <Link key={link.href} href={link.href}>
            <Button type='link' style={{ padding: 0, height: 'auto' }}>
              {link.label}
            </Button>
          </Link>
        ))}
      </div>
    </>
  );
}

// ── Per-node drawer content ─────────────────────────────────────

function DrawerContent({ node, stats }: { node: Node; stats: SystemStatsResponse }) {
  const data = node.data as Record<string, unknown>;
  const nodeId = node.id;
  const count = data.count as number | undefined;
  const layer = data.layer as string;
  const signal = data.healthSignal as string | null;

  const layerLabels: Record<string, string> = {
    source: 'Input Data',
    data: 'Raw Data',
    governance: 'Assumptions',
    processing: 'Calculation Engine',
    output: 'Outputs'
  };

  const header = (
    <Descriptions column={1} size='small' bordered>
      <Descriptions.Item label='Layer'>
        <Tag color={LAYER_COLORS[layer]}>{layerLabels[layer] ?? layer}</Tag>
      </Descriptions.Item>
      {count != null && <Descriptions.Item label='Total Count'>{count.toLocaleString()}</Descriptions.Item>}
      {signal && (
        <Descriptions.Item label='Health'>
          <Typography.Text type='danger'>{signal}</Typography.Text>
        </Descriptions.Item>
      )}
    </Descriptions>
  );

  const ip = stats.impactPaths;

  switch (nodeId) {
    case 'projects':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Single-use line items', value: stats.singleUseItems },
              { label: 'Reusable line items', value: stats.reusableItems },
              { label: 'Projects with milestones', value: ip.projectsWithMilestones },
              { label: 'Projects with compute runs', value: ip.projectsWithRuns },
              { label: 'Total milestones', value: stats.milestones }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'Open Projects', href: '/admin/projects' },
              { label: 'View Data Health Issues', href: '/admin/data-science/inputs' },
              { label: 'Trace a Project (Projections)', href: '/admin/data-science/data-map?mode=projections' },
              { label: 'Trace a Project (Actuals)', href: '/admin/data-science/data-map?mode=actuals' }
            ]}
          />
        </>
      );

    case 'rsp-api-keys':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Usage periods ingested', value: stats.usageTimePeriods },
              { label: 'Usage products', value: stats.usagePeriodProducts },
              {
                label: 'Actuals compute runs',
                value: stats.runsByType['actuals_ingest'] ?? 0
              }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'View RSP Ingestion Feed', href: '/admin/data-science/data-map?mode=rsp' },
              { label: 'Manage API Keys', href: '/admin/rsp/api-keys' },
              { label: 'RSP Dashboard', href: '/admin/rsp' },
              { label: 'Test Hub', href: '/admin/rsp/test-hub' }
            ]}
          />
        </>
      );

    case 'import-sessions':
      return (
        <>
          {header}
          <ImpactPathSection items={[{ label: 'Total import sessions', value: stats.importSessions }]} />
          <ActionLinks links={[{ label: 'Open AI Data Uploader', href: '/admin/data-science/import' }]} />
        </>
      );

    case 'single-use-items':
    case 'reusable-items':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Feeds into compute runs', value: stats.computeRuns },
              { label: 'Which produce metrics', value: stats.metricResults }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'View Projects', href: '/admin/projects' },
              { label: 'Trace Projections', href: '/admin/data-science/data-map?mode=projections' }
            ]}
          />
        </>
      );

    case 'usage-time-periods':
    case 'usage-period-products':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Usage periods', value: stats.usageTimePeriods },
              { label: 'Usage products', value: stats.usagePeriodProducts },
              {
                label: 'Actuals compute runs',
                value: stats.runsByType['actuals_ingest'] ?? 0
              }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'View RSP Ingestion Feed', href: '/admin/data-science/data-map?mode=rsp' },
              { label: 'Trace RSP Data', href: '/admin/data-science/data-map?mode=actuals' }
            ]}
          />
        </>
      );

    case 'milestones':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Projects with milestones', value: ip.projectsWithMilestones },
              { label: 'Linked to compute runs', value: ip.runsWithMetrics }
            ]}
          />
          <ActionLinks links={[{ label: 'View Actuals Traces', href: '/admin/data-science/data-map?mode=actuals' }]} />
        </>
      );

    case 'factors':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Active factors', value: stats.factors },
              { label: 'Factor versions', value: stats.factorVersions },
              { label: 'Pending change requests', value: ip.pendingChangeRequests },
              { label: 'Calculator functions using factors', value: stats.calculatorFunctions },
              { label: 'Output metrics affected', value: stats.uniqueOutputMetrics }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'View Factors', href: '/admin/data-science/constants' },
              { label: 'View Change Requests', href: '/admin/data-science/change-requests' },
              { label: 'Open Lineage', href: '/admin/data-science/lineage' }
            ]}
          />
        </>
      );

    case 'factor-versions':
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Factor versions', value: stats.factorVersions },
              { label: 'Calculator functions using these', value: stats.calculatorFunctions },
              { label: 'Compute runs affected', value: stats.computeRuns },
              { label: 'Metrics produced', value: stats.metricResults },
              { label: 'Pending change requests', value: ip.pendingChangeRequests }
            ]}
          />
          <ActionLinks
            links={[
              { label: 'View Factors', href: '/admin/data-science/constants' },
              { label: 'View Change Requests', href: '/admin/data-science/change-requests' },
              { label: 'Open Lineage', href: '/admin/data-science/lineage' }
            ]}
          />
        </>
      );

    case 'calc-functions': {
      const details = stats.calcFunctionDetails ?? [];
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Unique functions', value: stats.calculatorFunctions },
              { label: 'Source files', value: stats.calculatorFiles },
              { label: 'Output metric paths', value: stats.uniqueOutputMetrics },
              { label: 'Compute runs using these', value: stats.computeRuns }
            ]}
          />
          <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
            Functions
          </Divider>
          <List
            size='small'
            dataSource={details}
            renderItem={(fn: CalcFunctionDetail) => (
              <List.Item>
                <List.Item.Meta
                  title={<Typography.Text code>{fn.name}</Typography.Text>}
                  description={
                    <>
                      <div style={{ fontSize: 11, color: '#888' }}>{fn.file}</div>
                      <Tag
                        color={
                          fn.category === 'environmental' ? 'green' : fn.category === 'financial' ? 'blue' : 'orange'
                        }
                        style={{ marginTop: 4, fontSize: 10 }}
                      >
                        {fn.category}
                      </Tag>
                      <span style={{ fontSize: 11, marginLeft: 8 }}>
                        {fn.outputMetrics.length} output metric{fn.outputMetrics.length > 1 ? 's' : ''}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
          <ActionLinks
            links={[
              { label: 'View Calculations Registry', href: '/admin/data-science/calculations' },
              { label: 'Open Lineage', href: '/admin/data-science/lineage' },
              { label: 'View Test Runs', href: '/admin/data-science/test-runs' }
            ]}
          />
        </>
      );
    }

    case 'compute-runs': {
      const byStatus = data.runsByStatus as Record<string, number> | undefined;
      const byType = data.runsByType as Record<string, number> | undefined;
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Runs with metrics', value: ip.runsWithMetrics },
              { label: 'Total metrics produced', value: stats.metricResults },
              { label: 'Unique metric keys', value: ip.uniqueMetricKeys }
            ]}
          />
          {byStatus && (
            <>
              <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
                By Status
              </Divider>
              <Descriptions column={1} size='small' bordered>
                {Object.entries(byStatus).map(([status, cnt]) => (
                  <Descriptions.Item key={status} label={status}>
                    <Typography.Text
                      type={status === 'failed' ? 'danger' : status === 'success' ? 'success' : undefined}
                    >
                      {cnt.toLocaleString()}
                    </Typography.Text>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </>
          )}
          {byType && (
            <>
              <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
                By Run Type
              </Divider>
              <Descriptions column={1} size='small' bordered>
                {Object.entries(byType).map(([runType, cnt]) => (
                  <Descriptions.Item key={runType} label={runType}>
                    {cnt.toLocaleString()}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </>
          )}
          <ActionLinks
            links={[
              { label: 'View Run History', href: '/admin/data-science/runs' },
              { label: 'View Test Runs', href: '/admin/data-science/test-runs' },
              { label: 'Trace a Project', href: '/admin/data-science/data-map?mode=projections' }
            ]}
          />
        </>
      );
    }

    case 'metric-results': {
      const metricKeys = ip.metricKeys ?? {};
      const topMetrics = Object.entries(metricKeys)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
      return (
        <>
          {header}
          <ImpactPathSection
            items={[
              { label: 'Total metric results', value: stats.metricResults },
              { label: 'Unique metric keys', value: ip.uniqueMetricKeys },
              { label: 'Produced by compute runs', value: ip.runsWithMetrics },
              { label: 'Sourced from factors', value: stats.factors },
              { label: 'Via calculator functions', value: stats.calculatorFunctions }
            ]}
          />
          {topMetrics.length > 0 && (
            <>
              <Divider orientation='left' plain style={{ margin: '16px 0 8px' }}>
                Top Metric Keys
              </Divider>
              <Descriptions column={1} size='small' bordered>
                {topMetrics.map(([key, cnt]) => (
                  <Descriptions.Item
                    key={key}
                    label={
                      <Typography.Text code style={{ fontSize: 11 }}>
                        {key}
                      </Typography.Text>
                    }
                  >
                    {cnt.toLocaleString()}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </>
          )}
          <ActionLinks
            links={[
              { label: 'View Run History', href: '/admin/data-science/runs' },
              { label: 'Open Lineage', href: '/admin/data-science/lineage' },
              { label: 'View Calculations', href: '/admin/data-science/calculations' },
              { label: 'View Impact Dashboard', href: '/admin/data-science/impact' }
            ]}
          />
        </>
      );
    }

    default:
      return header;
  }
}

// ── Main graph component ────────────────────────────────────────

export function SystemGraph() {
  const { data: stats, isLoading } = useSWR<SystemStatsResponse>('/api/admin/data-map/system-stats', fetcher);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!stats) return;
    const { nodes: n, edges: e } = buildSystemGraph(stats);
    setRawNodes(n);
    setRawEdges(e);
  }, [stats]);

  // Apply path highlighting
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
      return { ...n, data: { ...n.data, dimmed: !isConnected } };
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

  useEffect(() => {
    setNodes(highlightedGraph.nodes);
    setEdges(highlightedGraph.edges);
  }, [highlightedGraph]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const isLabel = (node.data as Record<string, unknown>).isLabel;
      if (isLabel) return;

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

  const handleDrawerClose = useCallback(() => {
    setDrawerNode(null);
    setSelectedNodeId(null);
  }, []);

  if (isLoading || !stats) {
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
      <Drawer
        open={!!drawerNode}
        onClose={handleDrawerClose}
        width={460}
        title={(drawerNode?.data as Record<string, unknown> | undefined)?.label as string}
      >
        {drawerNode && <DrawerContent node={drawerNode} stats={stats} />}
      </Drawer>
    </div>
  );
}

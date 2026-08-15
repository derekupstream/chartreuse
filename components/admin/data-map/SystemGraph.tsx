import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Descriptions, Divider, Drawer, List, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import type { Edge, Node, NodeProps, ReactFlowInstance } from 'reactflow';
import ReactFlow, { Background, Controls, MarkerType, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import type { SchemaField, SchemaModel } from 'lib/admin/schemaTypes';

import { ExpandableNode } from './ExpandableNode';
import type { CalcFunctionDetail, ExpandedNodeInfo, SystemStatsResponse } from './systemGraphLayout';
import {
  EXPANDED_NODE_WIDTH,
  buildSystemGraph,
  getConnectedEdges,
  getConnectedPath,
  relayoutGraph
} from './systemGraphLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LAYER_COLORS: Record<string, string> = {
  source: '#1677ff',
  data: '#666',
  governance: '#722ed1',
  processing: '#fa8c16',
  output: '#52c41a'
};

// ── Node renderers ──────────────────────────────────────────────

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

const nodeTypes = { default: ExpandableNode, 'layer-label': LabelNode };

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

// ── Sample data content ─────────────────────────────────────────

interface SampleModel {
  model: string;
  rows: Record<string, unknown>[];
  total: number;
}

interface SampleResponse {
  nodeId: string;
  models: SampleModel[];
}

function SampleDataContent({ nodeId }: { nodeId: string }) {
  const { data, isLoading } = useSWR<SampleResponse>(`/api/admin/data-map/sample?nodeId=${nodeId}&take=5`, fetcher);

  if (isLoading) return <Spin size='small' />;
  if (!data || data.models.length === 0) {
    return <Typography.Text type='secondary'>No sample data available for this node.</Typography.Text>;
  }

  return (
    <>
      {data.models.map(m => {
        if (m.rows.length === 0) {
          return (
            <div key={m.model}>
              <Typography.Text strong>{m.model}</Typography.Text>
              <Typography.Text type='secondary' style={{ marginLeft: 8 }}>
                0 rows
              </Typography.Text>
            </div>
          );
        }

        // Build columns from the first row's keys
        const keys = Object.keys(m.rows[0]);
        const columns: ColumnsType<Record<string, unknown>> = keys.map(key => ({
          title: key,
          dataIndex: key,
          key,
          ellipsis: true,
          width: key === 'id' ? 80 : undefined,
          render: (v: unknown) => {
            if (v === null || v === undefined) return <Typography.Text type='secondary'>null</Typography.Text>;
            if (v instanceof Object)
              return (
                <Typography.Text code style={{ fontSize: 10 }}>
                  {JSON.stringify(v)}
                </Typography.Text>
              );
            const s = String(v);
            // Truncate long values
            if (s.length > 60) return <Typography.Text title={s}>{s.slice(0, 57)}...</Typography.Text>;
            return s;
          }
        }));

        return (
          <div key={m.model} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Typography.Text strong>{m.model}</Typography.Text>
              <Tag>{m.total.toLocaleString()} total</Tag>
              <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                showing {m.rows.length}
              </Typography.Text>
            </div>
            <Table
              dataSource={m.rows}
              columns={columns}
              rowKey={r => String(r.id ?? JSON.stringify(r))}
              size='small'
              pagination={false}
              scroll={{ x: 'max-content' }}
              style={{ fontSize: 11 }}
            />
          </div>
        );
      })}
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
              { label: 'View Calculation Log', href: '/admin/data-science/runs' },
              { label: 'Open Lineage', href: '/admin/data-science/lineage' },
              { label: 'View Functions', href: '/admin/data-science/calculations' }
            ]}
          />
        </>
      );
    }

    default:
      return header;
  }
}

// ── Schema data cache type ──────────────────────────────────────

interface SchemaResponse {
  models: SchemaModel[];
  nodeId: string;
}

// ── Main graph component ────────────────────────────────────────

export function SystemGraph() {
  const { data: stats, isLoading } = useSWR<SystemStatsResponse>('/api/admin/data-map/system-stats', fetcher);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sampleNodeId, setSampleNodeId] = useState<string | null>(null);

  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  // Track which nodes are expanded and their schema data
  const [expandedNodes, setExpandedNodes] = useState<Map<string, SchemaModel>>(new Map());
  const schemaCache = useRef<Map<string, SchemaModel[]>>(new Map());
  const flowRef = useRef<ReactFlowInstance | null>(null);

  // FK relationship edges created by clicking relation fields
  interface FkEdge {
    sourceNodeId: string;
    targetNodeId: string;
    fieldName: string;
    relatedModel: string;
  }
  const [fkEdges, setFkEdges] = useState<FkEdge[]>([]);

  // Expansion breadcrumb trail — ordered list of node IDs as they were expanded
  const [expansionPath, setExpansionPath] = useState<string[]>([]);

  // Reverse lookup: model name → node ID (built from rawNodes entity data)
  const modelToNodeId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of rawNodes) {
      const entity = (n.data as Record<string, unknown>).entity as string | undefined;
      if (entity) map[entity] = n.id;
    }
    return map;
  }, [rawNodes]);

  useEffect(() => {
    if (!stats) return;
    const { nodes: n, edges: e } = buildSystemGraph(stats);
    setRawNodes(n);
    setRawEdges(e);
  }, [stats]);

  // Toggle node expansion — fetch schema if needed
  const handleToggleExpand = useCallback(
    async (nodeId: string, addToPath = true) => {
      if (expandedNodes.has(nodeId)) {
        // Collapse — also remove any FK edges involving this node
        setExpandedNodes(prev => {
          const next = new Map(prev);
          next.delete(nodeId);
          return next;
        });
        setFkEdges(prev => prev.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));
        setExpansionPath(prev => prev.filter(id => id !== nodeId));
        return;
      }

      // Expand — fetch schema if not cached
      let models = schemaCache.current.get(nodeId);
      if (!models) {
        try {
          const res = await fetch(`/api/admin/data-map/schema?nodeId=${nodeId}`);
          const data: SchemaResponse = await res.json();
          models = data.models;
          schemaCache.current.set(nodeId, models);
        } catch {
          return; // Silently fail — node stays collapsed
        }
      }

      if (!models || models.length === 0) return; // No schema for this node (e.g., calc-functions)

      setExpandedNodes(prev => {
        const next = new Map(prev);
        next.set(nodeId, models![0]);
        return next;
      });
      if (addToPath) {
        setExpansionPath(prev => (prev.includes(nodeId) ? prev : [...prev, nodeId]));
      }
    },
    [expandedNodes]
  );

  // Handle relation field click — expand related node + create FK edge
  const handleFieldClick = useCallback(
    (field: SchemaField, sourceNodeId: string) => {
      if (!field.isRelation || !field.relatedModel) return;

      // Find which node maps to this related model
      const targetNodeId = modelToNodeId[field.relatedModel];
      if (!targetNodeId) return; // Model not represented in the system graph

      // Create FK edge if it doesn't already exist
      const edgeExists = fkEdges.some(
        e => e.sourceNodeId === sourceNodeId && e.targetNodeId === targetNodeId && e.fieldName === field.name
      );
      if (!edgeExists) {
        setFkEdges(prev => [
          ...prev,
          { sourceNodeId, targetNodeId, fieldName: field.name, relatedModel: field.relatedModel! }
        ]);
      }

      // Expand target node if not already expanded
      if (!expandedNodes.has(targetNodeId)) {
        handleToggleExpand(targetNodeId);
      }
    },
    [modelToNodeId, fkEdges, expandedNodes, handleToggleExpand]
  );

  // Undo last expansion in the breadcrumb trail
  const handleBack = useCallback(() => {
    if (expansionPath.length === 0) return;
    const lastNodeId = expansionPath[expansionPath.length - 1];
    handleToggleExpand(lastNodeId, false); // Collapse without re-adding to path
  }, [expansionPath, handleToggleExpand]);

  // Collapse all — reset everything
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Map());
    setFkEdges([]);
    setExpansionPath([]);
  }, []);

  // View sample data for a node
  const handleViewData = useCallback((nodeId: string) => {
    setSampleNodeId(nodeId);
    setDrawerNode(null); // Close system drawer if open
  }, []);

  // Inject expand/collapse state + callbacks into node data, then relayout
  const graphWithExpansion = useMemo(() => {
    if (rawNodes.length === 0) return { nodes: rawNodes, edges: rawEdges };

    // Build expanded size map for relayout with scalar/relation counts
    const expandedSizes = new Map<string, ExpandedNodeInfo>();
    Array.from(expandedNodes.entries()).forEach(([nodeId, model]) => {
      const scalarCount = model.fields.filter(f => !f.isRelation).length;
      const relationCount = model.fields.filter(f => f.isRelation).length;
      expandedSizes.set(nodeId, { scalarCount, relationCount });
    });

    // Relayout with variable sizes
    const relaidNodes = expandedSizes.size > 0 ? relayoutGraph(rawNodes, rawEdges, expandedSizes) : rawNodes;

    // Inject expand state + callbacks into node data
    const enrichedNodes = relaidNodes.map(n => {
      const isLabel = (n.data as Record<string, unknown>).isLabel;
      if (isLabel) return n;

      const model = expandedNodes.get(n.id);
      const isExpanded = !!model;

      return {
        ...n,
        // When expanded, widen the node style
        style: isExpanded ? { ...n.style, width: EXPANDED_NODE_WIDTH } : n.style,
        data: {
          ...n.data,
          nodeId: n.id,
          expanded: isExpanded,
          fields: model?.fields,
          modelName: model?.name,
          onToggle: () => handleToggleExpand(n.id),
          onFieldClick: handleFieldClick,
          onViewData: handleViewData
        }
      };
    });

    // Build FK relationship edges (dashed, magenta)
    const FK_COLOR = '#eb2f96';
    const dynamicEdges: Edge[] = fkEdges.map(fk => ({
      id: `fk-${fk.sourceNodeId}-${fk.targetNodeId}-${fk.fieldName}`,
      source: fk.sourceNodeId,
      target: fk.targetNodeId,
      animated: true,
      style: { stroke: FK_COLOR, strokeWidth: 2, strokeDasharray: '6 3' },
      markerEnd: { type: MarkerType.ArrowClosed, color: FK_COLOR },
      label: fk.fieldName,
      labelStyle: { fontSize: 9, fill: FK_COLOR, fontFamily: 'SF Mono, Menlo, monospace' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number]
    }));

    return { nodes: enrichedNodes, edges: [...rawEdges, ...dynamicEdges] };
  }, [rawNodes, rawEdges, expandedNodes, fkEdges, handleToggleExpand, handleFieldClick, handleViewData]);

  // Apply path highlighting on top of expansion state
  const highlightedGraph = useMemo(() => {
    const { nodes: baseNodes, edges: baseEdges } = graphWithExpansion;

    if (!selectedNodeId) {
      return { nodes: baseNodes, edges: baseEdges };
    }

    const connectedNodes = getConnectedPath(selectedNodeId, baseEdges);
    const connectedEdgeIds = getConnectedEdges(connectedNodes, baseEdges);

    const dimmedNodes = baseNodes.map(n => {
      const isLabel = (n.data as Record<string, unknown>).isLabel;
      if (isLabel) return n;
      const isConnected = connectedNodes.has(n.id);
      return { ...n, data: { ...n.data, dimmed: !isConnected } };
    });

    const dimmedEdges = baseEdges.map(e => {
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
  }, [selectedNodeId, graphWithExpansion]);

  useEffect(() => {
    setNodes(highlightedGraph.nodes);
    setEdges(highlightedGraph.edges);
  }, [highlightedGraph]);

  // Fit view after expansion changes
  useEffect(() => {
    if (flowRef.current && expandedNodes.size >= 0) {
      // Small delay to let ReactFlow update node dimensions
      const timer = setTimeout(() => {
        flowRef.current?.fitView({ padding: 0.3, duration: 300 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [expandedNodes]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const isLabel = (node.data as Record<string, unknown>).isLabel;
      if (isLabel) return;

      setSampleNodeId(null); // Close sample drawer on node click
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

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    flowRef.current = instance;
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
        onInit={handleInit}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Zoom level indicator + breadcrumb */}
      {(expandedNodes.size > 0 || fkEdges.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 11,
            color: '#666',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 360
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Schema Explorer</span>
            <Tag color='blue' style={{ margin: 0, fontSize: 10 }}>
              {expandedNodes.size} expanded
            </Tag>
            {fkEdges.length > 0 && (
              <Tag color='magenta' style={{ margin: 0, fontSize: 10 }}>
                {fkEdges.length} FK{fkEdges.length > 1 ? 's' : ''}
              </Tag>
            )}
            <div style={{ flex: 1 }} />
            {expansionPath.length > 0 && (
              <Button
                type='link'
                size='small'
                style={{ padding: 0, fontSize: 11, height: 'auto' }}
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            <Button
              type='link'
              size='small'
              style={{ padding: 0, fontSize: 11, height: 'auto' }}
              onClick={handleCollapseAll}
            >
              Reset
            </Button>
          </div>
          {/* Breadcrumb trail */}
          {expansionPath.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {expansionPath.map((nodeId, i) => {
                const model = expandedNodes.get(nodeId);
                const label = model?.name ?? nodeId;
                return (
                  <span key={nodeId} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    {i > 0 && <span style={{ color: '#ccc', fontSize: 10 }}>{'\u2192'}</span>}
                    <Tag
                      color='processing'
                      style={{ margin: 0, fontSize: 10, cursor: 'pointer', lineHeight: '16px' }}
                      onClick={() => handleToggleExpand(nodeId)}
                    >
                      {label}
                    </Tag>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Drawer
        open={!!drawerNode}
        onClose={handleDrawerClose}
        width={460}
        title={(drawerNode?.data as Record<string, unknown> | undefined)?.label as string}
      >
        {drawerNode && <DrawerContent node={drawerNode} stats={stats} />}
      </Drawer>

      <Drawer
        open={!!sampleNodeId}
        onClose={() => setSampleNodeId(null)}
        width={560}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Sample Data</span>
            {sampleNodeId && (
              <Tag color='blue' style={{ margin: 0 }}>
                {expandedNodes.get(sampleNodeId)?.name ?? sampleNodeId}
              </Tag>
            )}
          </div>
        }
      >
        {sampleNodeId && <SampleDataContent nodeId={sampleNodeId} />}
      </Drawer>
    </div>
  );
}

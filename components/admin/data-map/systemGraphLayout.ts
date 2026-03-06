import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

// ---- Style constants ----
const SOURCE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 8, fontWeight: 600 };
const DATA_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 8 };
const GOVERNANCE_STYLE = { background: '#f9f0ff', border: '1px solid #722ed1', borderRadius: 8 };
const PROCESSING_STYLE = { background: '#fff7e6', border: '1px solid #fa8c16', borderRadius: 8 };
const OUTPUT_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8 };

// ---- API response interface ----
export interface SystemStatsResponse {
  projects: number;
  singleUseItems: number;
  reusableItems: number;
  milestones: number;
  computeRuns: number;
  metricResults: number;
  factors: number;
  factorVersions: number;
  usageTimePeriods: number;
  usagePeriodProducts: number;
  importSessions: number;
  rspApiKeys: number;
  runsByStatus: Record<string, number>;
  runsByType: Record<string, number>;
}

export function buildSystemGraph(data: SystemStatsResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // ── Data Sources (left column) ──────────────────────────────
  nodes.push({
    id: 'projects',
    data: {
      type: 'system-entity',
      label: `Projects (${data.projects})`,
      entity: 'projects',
      count: data.projects,
      layer: 'source'
    },
    position: { x: 0, y: 0 },
    style: SOURCE_STYLE
  });

  nodes.push({
    id: 'rsp-api-keys',
    data: {
      type: 'system-entity',
      label: `RSP API Keys (${data.rspApiKeys})`,
      entity: 'rspApiKeys',
      count: data.rspApiKeys,
      layer: 'source'
    },
    position: { x: 0, y: 0 },
    style: SOURCE_STYLE
  });

  nodes.push({
    id: 'import-sessions',
    data: {
      type: 'system-entity',
      label: `AI Imports (${data.importSessions})`,
      entity: 'importSessions',
      count: data.importSessions,
      layer: 'source'
    },
    position: { x: 0, y: 0 },
    style: SOURCE_STYLE
  });

  // ── Raw Data (second column) ────────────────────────────────
  nodes.push({
    id: 'single-use-items',
    data: {
      type: 'system-entity',
      label: `Single-Use Items (${data.singleUseItems})`,
      entity: 'singleUseItems',
      count: data.singleUseItems,
      layer: 'data'
    },
    position: { x: 0, y: 0 },
    style: DATA_STYLE
  });

  nodes.push({
    id: 'reusable-items',
    data: {
      type: 'system-entity',
      label: `Reusable Items (${data.reusableItems})`,
      entity: 'reusableItems',
      count: data.reusableItems,
      layer: 'data'
    },
    position: { x: 0, y: 0 },
    style: DATA_STYLE
  });

  nodes.push({
    id: 'usage-time-periods',
    data: {
      type: 'system-entity',
      label: `Usage Periods (${data.usageTimePeriods})`,
      entity: 'usageTimePeriods',
      count: data.usageTimePeriods,
      layer: 'data'
    },
    position: { x: 0, y: 0 },
    style: DATA_STYLE
  });

  nodes.push({
    id: 'usage-period-products',
    data: {
      type: 'system-entity',
      label: `Usage Products (${data.usagePeriodProducts})`,
      entity: 'usagePeriodProducts',
      count: data.usagePeriodProducts,
      layer: 'data'
    },
    position: { x: 0, y: 0 },
    style: DATA_STYLE
  });

  nodes.push({
    id: 'milestones',
    data: {
      type: 'system-entity',
      label: `Milestones (${data.milestones})`,
      entity: 'milestones',
      count: data.milestones,
      layer: 'data'
    },
    position: { x: 0, y: 0 },
    style: DATA_STYLE
  });

  // ── Governance (third column) ───────────────────────────────
  nodes.push({
    id: 'factors',
    data: {
      type: 'system-entity',
      label: `Factors (${data.factors})`,
      entity: 'factors',
      count: data.factors,
      layer: 'governance'
    },
    position: { x: 0, y: 0 },
    style: GOVERNANCE_STYLE
  });

  nodes.push({
    id: 'factor-versions',
    data: {
      type: 'system-entity',
      label: `Factor Versions (${data.factorVersions})`,
      entity: 'factorVersions',
      count: data.factorVersions,
      layer: 'governance'
    },
    position: { x: 0, y: 0 },
    style: GOVERNANCE_STYLE
  });

  // ── Processing (fourth column) ──────────────────────────────
  const successRuns = data.runsByStatus['success'] ?? 0;
  const failedRuns = data.runsByStatus['failed'] ?? 0;
  const runningRuns = data.runsByStatus['running'] ?? 0;

  nodes.push({
    id: 'compute-runs',
    data: {
      type: 'system-compute-runs',
      label: `Compute Runs (${data.computeRuns})`,
      entity: 'computeRuns',
      count: data.computeRuns,
      runsByStatus: data.runsByStatus,
      runsByType: data.runsByType,
      layer: 'processing',
      subtitle: `${successRuns} ok / ${failedRuns} fail / ${runningRuns} running`
    },
    position: { x: 0, y: 0 },
    style: PROCESSING_STYLE
  });

  // ── Output (right column) ──────────────────────────────────
  nodes.push({
    id: 'metric-results',
    data: {
      type: 'system-entity',
      label: `Metric Results (${data.metricResults})`,
      entity: 'metricResults',
      count: data.metricResults,
      layer: 'output'
    },
    position: { x: 0, y: 0 },
    style: OUTPUT_STYLE
  });

  // ── Edges ──────────────────────────────────────────────────
  // [source, target, color] — color groups by data flow path
  const EDGE_COLOR_PROJECT = '#1677ff';
  const EDGE_COLOR_RSP = '#13c2c2';
  const EDGE_COLOR_GOV = '#722ed1';
  const EDGE_COLOR_OUTPUT = '#52c41a';

  const edgeDefs: [string, string, string][] = [
    // Project data flow (blue)
    ['projects', 'single-use-items', EDGE_COLOR_PROJECT],
    ['projects', 'reusable-items', EDGE_COLOR_PROJECT],
    ['projects', 'milestones', EDGE_COLOR_PROJECT],
    // RSP data flow (teal)
    ['rsp-api-keys', 'usage-time-periods', EDGE_COLOR_RSP],
    ['usage-time-periods', 'usage-period-products', EDGE_COLOR_RSP],
    // Data → Processing
    ['single-use-items', 'compute-runs', EDGE_COLOR_PROJECT],
    ['reusable-items', 'compute-runs', EDGE_COLOR_PROJECT],
    ['usage-period-products', 'compute-runs', EDGE_COLOR_RSP],
    ['milestones', 'compute-runs', EDGE_COLOR_PROJECT],
    // Governance → Processing (purple)
    ['factors', 'factor-versions', EDGE_COLOR_GOV],
    ['factor-versions', 'compute-runs', EDGE_COLOR_GOV],
    // Processing → Output (green)
    ['compute-runs', 'metric-results', EDGE_COLOR_OUTPUT]
  ];

  for (const [source, target, color] of edgeDefs) {
    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color },
      style: { stroke: color, strokeWidth: 2 }
    });
  }

  // ── Dagre layout (top-to-bottom for system view) ────────────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 100 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  nodes.forEach(n => {
    const pos = g.node(n.id);
    if (pos) {
      n.position = { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 };
    }
  });

  return { nodes, edges };
}

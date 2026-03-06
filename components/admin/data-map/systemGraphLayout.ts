import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const LABEL_WIDTH = 180;
const LABEL_HEIGHT = 28;

// ---- Style constants ----
const SOURCE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 8 };
const DATA_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 8 };
const GOVERNANCE_STYLE = { background: '#f9f0ff', border: '1px solid #722ed1', borderRadius: 8 };
const PROCESSING_STYLE = { background: '#fff7e6', border: '1px solid #fa8c16', borderRadius: 8 };
const OUTPUT_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8 };

// ---- API response interface ----
export interface CalcFunctionDetail {
  name: string;
  file: string;
  category: string;
  outputMetrics: string[];
}

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
  health: Record<string, Record<string, number>>;
  calculatorFunctions: number;
  calculatorFiles: number;
  calcFunctionDetails: CalcFunctionDetail[];
  uniqueOutputMetrics: number;
  impactPaths: {
    projectsWithRuns: number;
    projectsWithMilestones: number;
    runsWithMetrics: number;
    pendingChangeRequests: number;
    uniqueMetricKeys: number;
    metricKeys: Record<string, number>;
  };
}

// Map node IDs to their DataHealthIssue entity names
const NODE_HEALTH_ENTITY: Record<string, string> = {
  projects: 'Project',
  'single-use-items': 'SingleUseLineItem',
  'reusable-items': 'ReusableLineItem',
  milestones: 'ProjectMilestone',
  'compute-runs': 'ComputeRun',
  'metric-results': 'MetricResult',
  factors: 'Factor',
  'factor-versions': 'FactorVersion',
  'usage-time-periods': 'UsageTimePeriod',
  'usage-period-products': 'UsagePeriodProduct',
  'import-sessions': 'ImportSession',
  'rsp-api-keys': 'RspApiKey'
};

function healthSignal(health: Record<string, Record<string, number>>, nodeId: string): string | null {
  const entity = NODE_HEALTH_ENTITY[nodeId];
  if (!entity || !health[entity]) return null;
  const h = health[entity];
  const errors = h['error'] ?? h['critical'] ?? 0;
  const warnings = h['warning'] ?? 0;
  const parts: string[] = [];
  if (errors > 0) parts.push(`${errors} error${errors > 1 ? 's' : ''}`);
  if (warnings > 0) parts.push(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function healthSeverity(health: Record<string, Record<string, number>>, nodeId: string): 'error' | 'warning' | null {
  const entity = NODE_HEALTH_ENTITY[nodeId];
  if (!entity || !health[entity]) return null;
  const h = health[entity];
  if ((h['error'] ?? 0) > 0 || (h['critical'] ?? 0) > 0) return 'error';
  if ((h['warning'] ?? 0) > 0) return 'warning';
  return null;
}

function makeNode(
  id: string,
  label: string,
  layer: string,
  style: Record<string, unknown>,
  health: Record<string, Record<string, number>>,
  extra?: Record<string, unknown>
): Node {
  const signal = healthSignal(health, id);
  const severity = healthSeverity(health, id);
  return {
    id,
    data: {
      type: 'system-entity',
      label,
      entity: NODE_HEALTH_ENTITY[id] ?? id,
      layer,
      healthSignal: signal,
      healthSeverity: severity,
      ...extra
    },
    position: { x: 0, y: 0 },
    style
  };
}

// Layer label nodes — non-interactive, positioned above their column after layout
function makeLabelNode(id: string, label: string): Node {
  return {
    id,
    type: 'layer-label',
    data: { type: 'layer-label', label, isLabel: true },
    position: { x: 0, y: 0 },
    selectable: false,
    draggable: false,
    connectable: false,
    style: {
      background: 'transparent',
      border: 'none',
      pointerEvents: 'none' as const,
      width: LABEL_WIDTH
    }
  };
}

export function buildSystemGraph(data: SystemStatsResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const h = data.health;

  // ── Input Data ──────────────────────────────────────────────
  nodes.push(makeNode('projects', `Projects (${data.projects})`, 'source', SOURCE_STYLE, h, { count: data.projects }));
  nodes.push(
    makeNode('rsp-api-keys', `RSP API Keys (${data.rspApiKeys})`, 'source', SOURCE_STYLE, h, {
      count: data.rspApiKeys
    })
  );
  nodes.push(
    makeNode('import-sessions', `AI Imports (${data.importSessions})`, 'source', SOURCE_STYLE, h, {
      count: data.importSessions
    })
  );

  // ── Raw Data ────────────────────────────────────────────────
  nodes.push(
    makeNode('single-use-items', `Single-Use Items (${data.singleUseItems})`, 'data', DATA_STYLE, h, {
      count: data.singleUseItems
    })
  );
  nodes.push(
    makeNode('reusable-items', `Reusable Items (${data.reusableItems})`, 'data', DATA_STYLE, h, {
      count: data.reusableItems
    })
  );
  nodes.push(
    makeNode('usage-time-periods', `Usage Periods (${data.usageTimePeriods})`, 'data', DATA_STYLE, h, {
      count: data.usageTimePeriods
    })
  );
  nodes.push(
    makeNode('usage-period-products', `Usage Products (${data.usagePeriodProducts})`, 'data', DATA_STYLE, h, {
      count: data.usagePeriodProducts
    })
  );
  nodes.push(
    makeNode('milestones', `Milestones (${data.milestones})`, 'data', DATA_STYLE, h, { count: data.milestones })
  );

  // ── Assumptions (Governance) ────────────────────────────────
  nodes.push(
    makeNode('factors', `Factors (${data.factors})`, 'governance', GOVERNANCE_STYLE, h, { count: data.factors })
  );
  nodes.push(
    makeNode('factor-versions', `Factor Versions (${data.factorVersions})`, 'governance', GOVERNANCE_STYLE, h, {
      count: data.factorVersions
    })
  );

  // ── Calculation Engine ──────────────────────────────────────
  nodes.push({
    id: 'calc-functions',
    data: {
      type: 'system-entity',
      label: `Calculator Functions (${data.calculatorFunctions})`,
      entity: 'calculatorFunctions',
      layer: 'governance',
      count: data.calculatorFunctions,
      subtitle: `${data.calculatorFiles} source files`
    },
    position: { x: 0, y: 0 },
    style: GOVERNANCE_STYLE
  });

  const successRuns = data.runsByStatus['success'] ?? 0;
  const failedRuns = data.runsByStatus['failed'] ?? 0;
  const runningRuns = data.runsByStatus['running'] ?? 0;
  const runSignal = healthSignal(h, 'compute-runs');
  const failSignal = failedRuns > 0 ? `${failedRuns} failed` : null;
  const combinedSignal = [runSignal, failSignal].filter(Boolean).join(', ');

  nodes.push({
    id: 'compute-runs',
    data: {
      type: 'system-compute-runs',
      label: `Compute Runs (${data.computeRuns})`,
      entity: 'ComputeRun',
      count: data.computeRuns,
      runsByStatus: data.runsByStatus,
      runsByType: data.runsByType,
      layer: 'processing',
      subtitle: `${successRuns} ok / ${failedRuns} fail / ${runningRuns} running`,
      healthSignal: combinedSignal || null,
      healthSeverity: failedRuns > 0 ? 'error' : healthSeverity(h, 'compute-runs')
    },
    position: { x: 0, y: 0 },
    style: PROCESSING_STYLE
  });

  // ── Outputs ─────────────────────────────────────────────────
  nodes.push(
    makeNode('metric-results', `Metric Results (${data.metricResults})`, 'output', OUTPUT_STYLE, h, {
      count: data.metricResults
    })
  );

  // ── Edges ──────────────────────────────────────────────────
  const BLUE = '#1677ff';
  const TEAL = '#13c2c2';
  const PURPLE = '#722ed1';
  const GREEN = '#52c41a';

  const edgeDefs: [string, string, string][] = [
    // Project data flow (blue)
    ['projects', 'single-use-items', BLUE],
    ['projects', 'reusable-items', BLUE],
    ['projects', 'milestones', BLUE],
    // RSP data flow (teal)
    ['rsp-api-keys', 'usage-time-periods', TEAL],
    ['usage-time-periods', 'usage-period-products', TEAL],
    // Data → Processing
    ['single-use-items', 'compute-runs', BLUE],
    ['reusable-items', 'compute-runs', BLUE],
    ['usage-period-products', 'compute-runs', TEAL],
    ['milestones', 'compute-runs', BLUE],
    // Governance → Calc Engine → Processing (purple)
    ['factors', 'factor-versions', PURPLE],
    ['factor-versions', 'calc-functions', PURPLE],
    ['calc-functions', 'compute-runs', PURPLE],
    // Processing → Output (green)
    ['compute-runs', 'metric-results', GREEN]
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

  // ── Dagre layout ────────────────────────────────────────────
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

  // ── Position layer labels above each column ─────────────────
  // Group nodes by dagre rank (x position) to find column centers
  const columns: Record<string, { minY: number; centerX: number; layer: string }> = {};
  const layerOrder = ['source', 'data', 'governance', 'processing', 'output'];
  const layerLabels: Record<string, string> = {
    source: 'INPUT DATA',
    data: 'RAW DATA',
    governance: 'ASSUMPTIONS',
    processing: 'CALCULATION ENGINE',
    output: 'OUTPUTS'
  };

  for (const n of nodes) {
    const layer = (n.data as Record<string, unknown>).layer as string;
    if (!layer || !layerLabels[layer]) continue;
    if (!columns[layer]) {
      columns[layer] = { minY: n.position.y, centerX: n.position.x, layer };
    } else {
      columns[layer].minY = Math.min(columns[layer].minY, n.position.y);
      columns[layer].centerX = (columns[layer].centerX + n.position.x) / 2;
    }
  }

  for (const layer of layerOrder) {
    const col = columns[layer];
    if (!col) continue;
    const labelNode = makeLabelNode(`label-${layer}`, layerLabels[layer]);
    labelNode.position = { x: col.centerX, y: col.minY - 40 };
    nodes.push(labelNode);
  }

  return { nodes, edges };
}

// ── Edge adjacency for path highlighting ──────────────────────
// Returns all node IDs reachable upstream and downstream from a given node
export function getConnectedPath(nodeId: string, edges: Edge[]): Set<string> {
  const connected = new Set<string>([nodeId]);

  // Build adjacency
  const downstream = new Map<string, string[]>();
  const upstream = new Map<string, string[]>();
  for (const e of edges) {
    if (!downstream.has(e.source)) downstream.set(e.source, []);
    downstream.get(e.source)!.push(e.target);
    if (!upstream.has(e.target)) upstream.set(e.target, []);
    upstream.get(e.target)!.push(e.source);
  }

  // Walk downstream
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const next of downstream.get(current) ?? []) {
      if (!connected.has(next)) {
        connected.add(next);
        queue.push(next);
      }
    }
  }

  // Walk upstream
  const upQueue = [nodeId];
  while (upQueue.length > 0) {
    const current = upQueue.pop()!;
    for (const prev of upstream.get(current) ?? []) {
      if (!connected.has(prev)) {
        connected.add(prev);
        upQueue.push(prev);
      }
    }
  }

  return connected;
}

export function getConnectedEdges(connectedNodes: Set<string>, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  for (const e of edges) {
    if (connectedNodes.has(e.source) && connectedNodes.has(e.target)) {
      result.add(e.id);
    }
  }
  return result;
}

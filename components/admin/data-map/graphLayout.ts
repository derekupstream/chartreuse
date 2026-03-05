import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

interface TraceProduct {
  id: string;
  reusableType: string | null;
  inCount: number | null;
  outCount: number | null;
  co2Kg: number | null;
  waterGal: number | null;
  wasteLbs: number | null;
}

interface TraceMetricResult {
  id: string;
  metricKey: string;
  value: number;
  units: string | null;
}

interface TraceComputeRun {
  id: string;
  status: string;
  errorText: string | null;
  metadataJson: unknown;
  startedAt: string | null;
  finishedAt: string | null;
  metricResults: TraceMetricResult[];
}

interface TracePeriod {
  id: string;
  createdAt: string;
  status: string;
  rawPayload: unknown;
  dateMin: string | null;
  dateMax: string | null;
  clientExternalId: string | null;
  co2AvoidedKg: number | null;
  waterSavedGallons: number | null;
  wasteDivertedLbs: number | null;
  supersededById: string | null;
  org: { id: string; name: string };
  submittedByKey: { id: string; keyPrefix: string } | null;
  products: TraceProduct[];
  computeRun: TraceComputeRun | null;
  issueCount?: number;
}

interface TracePriorPeriod {
  id: string;
  status: string;
  dateMin: string | null;
  dateMax: string | null;
  clientExternalId: string | null;
}

export interface TraceResponse {
  period: TracePeriod;
  priorPeriod: TracePriorPeriod | null;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

const GREY_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 6 };
const GREEN_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 6 };
const ORANGE_STYLE = { background: '#fff7e6', border: '1px solid #fa8c16', borderRadius: 6 };
const RED_STYLE = { background: '#fff2f0', border: '1px solid #ff4d4f', borderRadius: 6 };
const BLUE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 6 };

function getPeriodStatusStyle(status: string): Record<string, unknown> {
  switch (status) {
    case 'active':
      return GREEN_STYLE;
    case 'superseded':
      return ORANGE_STYLE;
    case 'failed':
      return RED_STYLE;
    case 'needs_review':
      return BLUE_STYLE;
    default:
      return GREY_STYLE;
  }
}

function getComputeRunStyle(status: string | null | undefined): Record<string, unknown> {
  switch (status) {
    case 'success':
      return GREEN_STYLE;
    case 'failed':
      return RED_STYLE;
    case 'running':
      return BLUE_STYLE;
    default:
      return GREY_STYLE;
  }
}

function getNodeStyle(nodeId: string, trace: TraceResponse): Record<string, unknown> {
  switch (nodeId) {
    case 'api-request':
    case 'validation':
    case 'dedup':
    case 'intelligence-update':
      return GREY_STYLE;

    case 'usage-period':
      return getPeriodStatusStyle(trace.period.status);

    case 'products':
      return trace.period.products.length > 0 ? getPeriodStatusStyle(trace.period.status) : GREY_STYLE;

    case 'compute-run':
      return getComputeRunStyle(trace.period.computeRun?.status ?? null);

    case 'metric-results':
      return getComputeRunStyle(trace.period.computeRun?.status ?? null);

    default:
      return GREY_STYLE;
  }
}

export function buildTraceGraph(trace: TraceResponse): { nodes: Node[]; edges: Edge[] } {
  const computeRunLabel = trace.period.computeRun ? 'Compute Run' : 'No Compute Run';
  const metricCount = trace.period.computeRun?.metricResults.length ?? 0;

  const nodes: Node[] = [
    {
      id: 'api-request',
      data: { type: 'api-request', period: trace.period, label: 'API Request' },
      position: { x: 0, y: 0 },
      style: getNodeStyle('api-request', trace)
    },
    {
      id: 'validation',
      data: { type: 'validation', period: trace.period, label: 'Validation' },
      position: { x: 0, y: 0 },
      style: getNodeStyle('validation', trace)
    },
    {
      id: 'dedup',
      data: { type: 'dedup', period: trace.period, priorPeriod: trace.priorPeriod, label: 'Dedup Check' },
      position: { x: 0, y: 0 },
      style: getNodeStyle('dedup', trace)
    },
    {
      id: 'usage-period',
      data: {
        type: 'usage-period',
        period: trace.period,
        label: 'Usage Period',
        issueCount: trace.period.issueCount ?? 0,
        entityId: trace.period.id
      },
      position: { x: 0, y: 0 },
      style: getNodeStyle('usage-period', trace)
    },
    {
      id: 'products',
      data: {
        type: 'products',
        products: trace.period.products,
        label: `${trace.period.products.length} Products`,
        issueCount: trace.period.issueCount ?? 0,
        entityId: trace.period.id
      },
      position: { x: 0, y: 0 },
      style: getNodeStyle('products', trace)
    },
    {
      id: 'compute-run',
      data: { type: 'compute-run', computeRun: trace.period.computeRun, label: computeRunLabel },
      position: { x: 0, y: 0 },
      style: getNodeStyle('compute-run', trace)
    },
    {
      id: 'metric-results',
      data: {
        type: 'metric-results',
        metricResults: trace.period.computeRun?.metricResults ?? [],
        label: `${metricCount} Metrics`
      },
      position: { x: 0, y: 0 },
      style: getNodeStyle('metric-results', trace)
    },
    {
      id: 'intelligence-update',
      data: {
        type: 'intelligence-update',
        metadataJson: trace.period.computeRun?.metadataJson,
        label: 'Intelligence Update'
      },
      position: { x: 0, y: 0 },
      style: getNodeStyle('intelligence-update', trace)
    }
  ];

  // Add prior-period node if superseded
  if (trace.priorPeriod) {
    nodes.push({
      id: 'prior-period',
      data: { type: 'prior-period', priorPeriod: trace.priorPeriod, label: 'Prior Period (Superseded)' },
      position: { x: 0, y: 0 },
      style: { opacity: 0.5, background: '#d9d9d9', borderRadius: 6 }
    });
  }

  const CHAIN: [string, string][] = [
    ['api-request', 'validation'],
    ['validation', 'dedup'],
    ['dedup', 'usage-period'],
    ['usage-period', 'products'],
    ['products', 'compute-run'],
    ['compute-run', 'metric-results'],
    ['metric-results', 'intelligence-update']
  ];

  const edges: Edge[] = CHAIN.map(([source, target]) => ({
    id: `${source}-${target}`,
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed }
  }));

  // Dashed supersession edge if priorPeriod exists
  if (trace.priorPeriod) {
    edges.push({
      id: 'supersession',
      source: 'usage-period',
      target: 'prior-period',
      animated: false,
      style: { strokeDasharray: '5,5', stroke: '#d9d9d9' },
      label: 'supersedes',
      markerEnd: { type: MarkerType.ArrowClosed }
    });
  }

  // Apply dagre LR layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  nodes.forEach(n => {
    const pos = g.node(n.id);
    n.position = { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 };
  });

  return { nodes, edges };
}

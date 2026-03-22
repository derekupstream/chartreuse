import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

interface TraceProduct {
  id: string;
  reusableType: string | null;
  inWarehouseEvents: number | null;
  outWarehouseEvents: number | null;
  co2AvoidedKg: number | null;
  waterSavedGallons: number | null;
  wasteDivertedLbs: number | null;
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

// ── Styles ──────────────────────────────────────────────────────────────────
const GREY_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 8 };
const GREEN_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8 };
const ORANGE_STYLE = { background: '#fff7e6', border: '1px solid #fa8c16', borderRadius: 8 };
const RED_STYLE = { background: '#fff2f0', border: '1px solid #ff4d4f', borderRadius: 8 };
const BLUE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 8 };
const TEAL_STYLE = { background: '#e6fffb', border: '1px solid #13c2c2', borderRadius: 8 };
const PURPLE_STYLE = { background: '#f9f0ff', border: '1px solid #722ed1', borderRadius: 8 };

// ── Edge colors ─────────────────────────────────────────────────────────────
const EDGE_INBOUND = '#1677ff'; // RSP → us (blue)
const EDGE_PROCESS = '#722ed1'; // internal processing (purple)
const EDGE_STORE = '#fa8c16'; // data storage (orange)
const EDGE_COMPUTE = '#13c2c2'; // computation (teal)
const EDGE_OUTPUT = '#52c41a'; // output metrics (green)
const EDGE_RESPONSE = '#eb2f96'; // us → RSP response (pink)
const EDGE_SUPERSEDE = '#d9d9d9';

function makeEdge(
  id: string,
  source: string,
  target: string,
  color: string,
  opts?: { animated?: boolean; dashed?: boolean; label?: string }
): Edge {
  return {
    id,
    source,
    target,
    animated: opts?.animated ?? true,
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: {
      stroke: color,
      strokeWidth: 2,
      ...(opts?.dashed ? { strokeDasharray: '6 4' } : {})
    },
    ...(opts?.label ? { label: opts.label, labelStyle: { fontSize: 10, fill: color } } : {})
  };
}

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

function formatDateRange(min: string | null, max: string | null): string {
  if (!min && !max) return '';
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return min ? `from ${fmt(min)}` : `to ${fmt(max!)}`;
}

function formatCO2(kg: number | null): string {
  if (kg == null) return '';
  return kg < 1 ? `${(kg * 1000).toFixed(0)}g CO\u2082` : `${kg.toFixed(2)} kg CO\u2082`;
}

export function buildTraceGraph(trace: TraceResponse): { nodes: Node[]; edges: Edge[] } {
  const p = trace.period;
  const products = p.products;
  const run = p.computeRun;
  const metrics = run?.metricResults ?? [];
  const totalOut = products.reduce((s, pr) => s + (pr.outWarehouseEvents ?? 0), 0);
  const totalIn = products.reduce((s, pr) => s + (pr.inWarehouseEvents ?? 0), 0);
  const productTypes = Array.from(new Set(products.map(pr => pr.reusableType).filter(Boolean))).join(', ');

  const nodes: Node[] = [
    // ── RSP origin node ──
    {
      id: 'rsp-origin',
      data: {
        label: p.org.name,
        subtitle: p.submittedByKey ? `key: ${p.submittedByKey.keyPrefix}...` : 'direct ingestion'
      },
      position: { x: 0, y: 0 },
      style: PURPLE_STYLE
    },

    // ── Inbound pipeline ──
    {
      id: 'api-request',
      data: {
        label: 'API Request',
        subtitle: p.clientExternalId ? `client: ${p.clientExternalId}` : 'POST /api/rsp/usage'
      },
      position: { x: 0, y: 0 },
      style: BLUE_STYLE
    },
    {
      id: 'validation',
      data: {
        label: 'Validation',
        subtitle: `${products.length} event${products.length !== 1 ? 's' : ''} · ${formatDateRange(p.dateMin, p.dateMax)}`
      },
      position: { x: 0, y: 0 },
      style: GREY_STYLE
    },
    {
      id: 'dedup',
      data: {
        label: 'Dedup Check',
        subtitle: trace.priorPeriod ? `supersedes 1 prior period` : 'no overlaps found'
      },
      position: { x: 0, y: 0 },
      style: trace.priorPeriod ? ORANGE_STYLE : GREY_STYLE
    },

    // ── Storage ──
    {
      id: 'usage-period',
      data: {
        label: 'Usage Period',
        subtitle: `${p.status} · ${totalOut.toLocaleString()} units out`,
        issueCount: p.issueCount ?? 0,
        entityId: p.id,
        healthSignal: p.status === 'superseded' ? 'superseded by newer period' : null,
        healthSeverity: p.status === 'superseded' ? 'warning' : null
      },
      position: { x: 0, y: 0 },
      style: getPeriodStatusStyle(p.status)
    },
    {
      id: 'products',
      data: {
        label: `${products.length} Product${products.length !== 1 ? 's' : ''}`,
        subtitle: productTypes || 'no product types',
        products,
        issueCount: p.issueCount ?? 0,
        entityId: p.id
      },
      position: { x: 0, y: 0 },
      style: products.length > 0 ? getPeriodStatusStyle(p.status) : GREY_STYLE
    },

    // ── Computation ──
    {
      id: 'compute-run',
      data: {
        label: run ? `Compute Run` : 'No Compute Run',
        subtitle: run ? `${run.status} · ${metrics.length} metric${metrics.length !== 1 ? 's' : ''}` : 'pending',
        computeRun: run,
        healthSignal: run?.status === 'failed' ? (run.errorText ?? 'run failed') : null,
        healthSeverity: run?.status === 'failed' ? 'error' : null
      },
      position: { x: 0, y: 0 },
      style: getComputeRunStyle(run?.status)
    },
    {
      id: 'metric-results',
      data: {
        label: `${metrics.length} Metric${metrics.length !== 1 ? 's' : ''}`,
        subtitle:
          metrics.length > 0
            ? metrics
                .slice(0, 3)
                .map(m => m.metricKey.replace(/_/g, ' '))
                .join(', ') + (metrics.length > 3 ? '...' : '')
            : 'no metrics',
        metricResults: metrics
      },
      position: { x: 0, y: 0 },
      style: run?.status === 'success' ? GREEN_STYLE : GREY_STYLE
    },

    // ── Response back to RSP ──
    {
      id: 'api-response',
      data: {
        label: 'API Response',
        subtitle:
          [
            formatCO2(p.co2AvoidedKg),
            p.wasteDivertedLbs != null ? `${p.wasteDivertedLbs.toFixed(1)} lbs waste` : null,
            p.waterSavedGallons != null ? `${p.waterSavedGallons.toFixed(0)} gal water` : null
          ]
            .filter(Boolean)
            .join(' · ') || 'metrics returned'
      },
      position: { x: 0, y: 0 },
      style: TEAL_STYLE
    },
    {
      id: 'rsp-destination',
      data: {
        label: p.org.name,
        subtitle: 'impact data delivered'
      },
      position: { x: 0, y: 0 },
      style: PURPLE_STYLE
    }
  ];

  // ── Prior period (superseded) ──
  if (trace.priorPeriod) {
    const pp = trace.priorPeriod;
    nodes.push({
      id: 'prior-period',
      data: {
        label: 'Prior Period',
        subtitle: `${pp.status} · ${formatDateRange(pp.dateMin, pp.dateMax)}`
      },
      position: { x: 0, y: 0 },
      style: { ...GREY_STYLE, opacity: 0.5 }
    });
  }

  // ── Edges ─────────────────────────────────────────────────────────────────

  const edges: Edge[] = [
    // Inbound flow (RSP → us): blue
    makeEdge('e-origin-api', 'rsp-origin', 'api-request', EDGE_INBOUND, { label: 'sends data' }),
    makeEdge('e-api-validate', 'api-request', 'validation', EDGE_INBOUND),
    makeEdge('e-validate-dedup', 'validation', 'dedup', EDGE_PROCESS),

    // Storage flow: orange
    makeEdge('e-dedup-period', 'dedup', 'usage-period', EDGE_STORE),
    makeEdge('e-period-products', 'usage-period', 'products', EDGE_STORE),

    // Computation flow: teal
    makeEdge('e-products-run', 'products', 'compute-run', EDGE_COMPUTE),
    makeEdge('e-run-metrics', 'compute-run', 'metric-results', EDGE_OUTPUT),

    // Response flow (us → RSP): pink
    makeEdge('e-metrics-response', 'metric-results', 'api-response', EDGE_RESPONSE),
    makeEdge('e-response-dest', 'api-response', 'rsp-destination', EDGE_RESPONSE, { label: 'returns metrics' })
  ];

  // Supersession edge
  if (trace.priorPeriod) {
    edges.push(
      makeEdge('e-supersede', 'usage-period', 'prior-period', EDGE_SUPERSEDE, {
        animated: false,
        dashed: true,
        label: 'supersedes'
      })
    );
  }

  // ── Dagre layout ──────────────────────────────────────────────────────────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 90 });

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

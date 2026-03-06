import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

// ---- Style constants ----
const GREY_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 8 };
const GREEN_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8 };
const RED_STYLE = { background: '#fff2f0', border: '1px solid #ff4d4f', borderRadius: 8 };
const BLUE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 8 };
const OUTPUT_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8 };

// ---- Edge colors ----
const EDGE_INPUT = '#1677ff';
const EDGE_COMPUTE = '#fa8c16';
const EDGE_METRIC = '#52c41a';

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

// ---- API response interface ----
export interface ProjectionsTraceResponse {
  project: { id: string; name: string; category: string; orgId: string };
  lineItemSummary: {
    singleUseCount: number;
    reusableCount: number;
    singleUseItems: Array<{
      id: string;
      productId: string;
      caseCost: number;
      casesPurchased: number;
      frequency: string;
    }>;
    reusableItems: Array<{ id: string; productName: string | null; caseCost: number; casesPurchased: number }>;
  };
  computeRun: {
    id: string;
    status: string;
    runType: string;
    startedAt: string;
    finishedAt: string | null;
    errorText: string | null;
    metricResults: Array<{ id: string; metricKey: string; valueNumeric: number | null; units: string }>;
  } | null;
}

function makeEdge(id: string, source: string, target: string, color: string): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color },
    style: { stroke: color, strokeWidth: 2 }
  };
}

export function buildProjectionsGraph(data: ProjectionsTraceResponse): { nodes: Node[]; edges: Edge[] } {
  const { project, lineItemSummary, computeRun } = data;
  const metricCount = computeRun?.metricResults.length ?? 0;
  const shortId = computeRun ? computeRun.id.substring(0, 8) : '';
  const totalItems = lineItemSummary.singleUseCount + lineItemSummary.reusableCount;

  // Total cost summaries
  const suTotalCost = lineItemSummary.singleUseItems.reduce((s, i) => s + i.caseCost * i.casesPurchased, 0);
  const reTotalCost = lineItemSummary.reusableItems.reduce((s, i) => s + i.caseCost * i.casesPurchased, 0);

  const nodes: Node[] = [
    {
      id: 'project',
      data: {
        type: 'project',
        project,
        label: project.name,
        entityId: project.id,
        subtitle: `${totalItems} line items · ${project.category}`
      },
      position: { x: 0, y: 0 },
      style: GREEN_STYLE
    },
    {
      id: 'single-use-items',
      data: {
        type: 'single-use-items',
        singleUseItems: lineItemSummary.singleUseItems,
        label: `${lineItemSummary.singleUseCount} Single-Use Items`,
        entityId: project.id,
        subtitle: suTotalCost > 0 ? `$${suTotalCost.toLocaleString()} total cost` : 'No items'
      },
      position: { x: 0, y: 0 },
      style: GREY_STYLE
    },
    {
      id: 'reusable-items',
      data: {
        type: 'reusable-items',
        reusableItems: lineItemSummary.reusableItems,
        label: `${lineItemSummary.reusableCount} Reusable Items`,
        entityId: project.id,
        subtitle: reTotalCost > 0 ? `$${reTotalCost.toLocaleString()} total cost` : 'No items'
      },
      position: { x: 0, y: 0 },
      style: GREY_STYLE
    },
    {
      id: 'compute-run',
      data: {
        type: 'compute-run',
        computeRun,
        label: computeRun ? `Run · ${computeRun.status} · ${shortId}` : 'No Compute Run',
        entityId: computeRun?.id ?? null,
        subtitle: computeRun
          ? `${computeRun.runType} · ${metricCount} metric${metricCount !== 1 ? 's' : ''}`
          : 'Not yet computed',
        healthSignal: computeRun?.status === 'failed' ? (computeRun.errorText ?? 'Run failed') : null,
        healthSeverity: computeRun?.status === 'failed' ? 'error' : null
      },
      position: { x: 0, y: 0 },
      style: getComputeRunStyle(computeRun?.status ?? null)
    },
    {
      id: 'metric-results',
      data: {
        type: 'metric-results',
        metricResults: computeRun?.metricResults ?? [],
        label: `${metricCount} Metrics`,
        entityId: computeRun?.id ?? null,
        subtitle:
          metricCount > 0
            ? (computeRun?.metricResults ?? [])
                .slice(0, 3)
                .map(m => m.metricKey)
                .join(', ') + (metricCount > 3 ? '...' : '')
            : 'No metrics'
      },
      position: { x: 0, y: 0 },
      style: computeRun?.status === 'success' ? OUTPUT_STYLE : GREY_STYLE
    }
  ];

  const edges: Edge[] = [
    makeEdge('project-single-use', 'project', 'single-use-items', EDGE_INPUT),
    makeEdge('project-reusable', 'project', 'reusable-items', EDGE_INPUT),
    makeEdge('single-use-compute', 'single-use-items', 'compute-run', EDGE_COMPUTE),
    makeEdge('reusable-compute', 'reusable-items', 'compute-run', EDGE_COMPUTE),
    makeEdge('compute-metrics', 'compute-run', 'metric-results', EDGE_METRIC)
  ];

  // Dagre layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 100 });

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

import dagre from '@dagrejs/dagre';
import { MarkerType } from 'reactflow';
import type { Edge, Node } from 'reactflow';

// ---- Style constants (copied from graphLayout.ts conventions) ----
const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

const GREY_STYLE = { background: '#f0f0f0', border: '1px solid #d9d9d9', borderRadius: 6 };
const GREEN_STYLE = { background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 6 };
const RED_STYLE = { background: '#fff2f0', border: '1px solid #ff4d4f', borderRadius: 6 };
const BLUE_STYLE = { background: '#e6f4ff', border: '1px solid #1677ff', borderRadius: 6 };

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

export function buildProjectionsGraph(data: ProjectionsTraceResponse): { nodes: Node[]; edges: Edge[] } {
  const { project, lineItemSummary, computeRun } = data;
  const metricCount = computeRun?.metricResults.length ?? 0;
  const shortId = computeRun ? computeRun.id.substring(0, 8) : '';

  const nodes: Node[] = [
    {
      id: 'project',
      data: { type: 'project', project, label: project.name, entityId: project.id },
      position: { x: 0, y: 0 },
      style: GREEN_STYLE
    },
    {
      id: 'single-use-items',
      data: {
        type: 'single-use-items',
        singleUseItems: lineItemSummary.singleUseItems,
        label: `${lineItemSummary.singleUseCount} Single-Use Items`,
        entityId: project.id
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
        entityId: project.id
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
        entityId: computeRun?.id ?? null
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
        entityId: computeRun?.id ?? null
      },
      position: { x: 0, y: 0 },
      style: computeRun?.status === 'success' ? GREEN_STYLE : GREY_STYLE
    }
  ];

  const edges: Edge[] = [
    {
      id: 'project-single-use',
      source: 'project',
      target: 'single-use-items',
      markerEnd: { type: MarkerType.ArrowClosed }
    },
    {
      id: 'project-reusable',
      source: 'project',
      target: 'reusable-items',
      markerEnd: { type: MarkerType.ArrowClosed }
    },
    {
      id: 'single-use-compute',
      source: 'single-use-items',
      target: 'compute-run',
      markerEnd: { type: MarkerType.ArrowClosed }
    },
    {
      id: 'reusable-compute',
      source: 'reusable-items',
      target: 'compute-run',
      markerEnd: { type: MarkerType.ArrowClosed }
    },
    {
      id: 'compute-metrics',
      source: 'compute-run',
      target: 'metric-results',
      markerEnd: { type: MarkerType.ArrowClosed }
    }
  ];

  // Apply dagre LR layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

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

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
const EDGE_PROJECT = '#1677ff';
const EDGE_MILESTONE = '#722ed1';
const EDGE_RUN = '#fa8c16';
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
export interface ActualsTraceResponse {
  project: { id: string; name: string; category: string; orgId: string };
  milestones: Array<{
    id: string;
    snapshotDate: string;
    label: string | null;
    source: string;
    co2AvoidedMtco2e: number | null;
    waterSavedGallons: number | null;
    wasteDivertedLbs: number | null;
    annualCostSavings: number | null;
    paybackMonths: number | null;
    computeRunId: string | null;
  }>;
  computeRuns: Array<{
    id: string;
    status: string;
    runType: string;
    startedAt: string;
    finishedAt: string | null;
    errorText: string | null;
    metricResults: Array<{ id: string; metricKey: string; valueNumeric: number | null; units: string }>;
  }>;
}

function formatSnapshotDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export function buildActualsGraph(data: ActualsTraceResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const milestoneCount = data.milestones.length;
  const runCount = data.computeRuns.length;
  const totalMetrics = data.computeRuns.reduce((sum, r) => sum + r.metricResults.length, 0);
  const failedRuns = data.computeRuns.filter(r => r.status === 'failed').length;

  // Project node
  nodes.push({
    id: 'project',
    data: {
      type: 'project',
      project: data.project,
      label: data.project.name,
      entityId: data.project.id,
      subtitle: `${milestoneCount} milestone${milestoneCount !== 1 ? 's' : ''} · ${runCount} run${runCount !== 1 ? 's' : ''}`
    },
    position: { x: 0, y: 0 },
    style: GREEN_STYLE
  });

  const linkedRunIds = new Set(data.milestones.map(m => m.computeRunId).filter(Boolean));

  // Milestone nodes
  for (const milestone of data.milestones) {
    const milestoneId = `milestone-${milestone.id}`;
    const dateLabel = formatSnapshotDate(milestone.snapshotDate);
    const nodeLabel = `${milestone.label ?? 'Snapshot'} · ${dateLabel}`;

    const hasCO2 = milestone.co2AvoidedMtco2e != null && milestone.co2AvoidedMtco2e > 0;
    const hasCost = milestone.annualCostSavings != null && milestone.annualCostSavings > 0;
    const subtitle = [
      hasCO2 ? `${milestone.co2AvoidedMtco2e!.toFixed(2)} MTCO₂e` : null,
      hasCost ? `$${milestone.annualCostSavings!.toLocaleString()}` : null,
      `source: ${milestone.source}`
    ]
      .filter(Boolean)
      .join(' · ');

    nodes.push({
      id: milestoneId,
      data: { type: 'milestone', milestone, label: nodeLabel, entityId: milestone.id, subtitle },
      position: { x: 0, y: 0 },
      style: GREY_STYLE
    });

    edges.push(makeEdge(`project-${milestoneId}`, 'project', milestoneId, EDGE_PROJECT));

    if (milestone.computeRunId) {
      const runNodeId = `compute-run-${milestone.computeRunId}`;
      const metricNodeId = `metric-results-${milestone.computeRunId}`;
      edges.push(makeEdge(`${milestoneId}-${runNodeId}`, milestoneId, runNodeId, EDGE_MILESTONE));
      edges.push(makeEdge(`${runNodeId}-${metricNodeId}`, runNodeId, metricNodeId, EDGE_METRIC));
    }
  }

  // Compute run nodes
  for (const run of data.computeRuns) {
    const runNodeId = `compute-run-${run.id}`;
    const metricNodeId = `metric-results-${run.id}`;
    const shortId = run.id.substring(0, 8);
    const metricCount = run.metricResults.length;

    nodes.push({
      id: runNodeId,
      data: {
        type: 'compute-run',
        computeRun: run,
        label: `Run · ${run.status} · ${shortId}`,
        entityId: run.id,
        subtitle: `${run.runType} · ${metricCount} metric${metricCount !== 1 ? 's' : ''}`,
        healthSignal: run.status === 'failed' ? (run.errorText ?? 'Run failed') : null,
        healthSeverity: run.status === 'failed' ? 'error' : null
      },
      position: { x: 0, y: 0 },
      style: getComputeRunStyle(run.status)
    });

    nodes.push({
      id: metricNodeId,
      data: {
        type: 'metric-results',
        metricResults: run.metricResults,
        label: `${metricCount} Metrics`,
        entityId: run.id,
        subtitle:
          metricCount > 0
            ? run.metricResults
                .slice(0, 3)
                .map(m => m.metricKey)
                .join(', ') + (metricCount > 3 ? '...' : '')
            : 'No metrics'
      },
      position: { x: 0, y: 0 },
      style: run.status === 'success' ? OUTPUT_STYLE : GREY_STYLE
    });

    if (!linkedRunIds.has(run.id)) {
      edges.push(makeEdge(`project-${runNodeId}`, 'project', runNodeId, EDGE_RUN));
      edges.push(makeEdge(`${runNodeId}-${metricNodeId}`, runNodeId, metricNodeId, EDGE_METRIC));
    }
  }

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

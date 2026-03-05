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

export function buildActualsGraph(data: ActualsTraceResponse): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Project node
  nodes.push({
    id: 'project',
    data: { type: 'project', project: data.project, label: data.project.name, entityId: data.project.id },
    position: { x: 0, y: 0 },
    style: GREEN_STYLE
  });

  // Build a set of computeRun IDs linked to milestones
  const linkedRunIds = new Set(data.milestones.map(m => m.computeRunId).filter(Boolean));

  // Milestone nodes
  for (const milestone of data.milestones) {
    const milestoneId = `milestone-${milestone.id}`;
    const dateLabel = formatSnapshotDate(milestone.snapshotDate);
    const nodeLabel = `${milestone.label ?? 'Snapshot'} · ${dateLabel}`;

    nodes.push({
      id: milestoneId,
      data: { type: 'milestone', milestone, label: nodeLabel, entityId: milestone.id },
      position: { x: 0, y: 0 },
      style: GREY_STYLE
    });

    // Edge: project → milestone
    edges.push({
      id: `project-${milestoneId}`,
      source: 'project',
      target: milestoneId,
      markerEnd: { type: MarkerType.ArrowClosed }
    });

    // If milestone is linked to a compute run, draw milestone → compute-run
    if (milestone.computeRunId) {
      const runNodeId = `compute-run-${milestone.computeRunId}`;
      const metricNodeId = `metric-results-${milestone.computeRunId}`;
      edges.push({
        id: `${milestoneId}-${runNodeId}`,
        source: milestoneId,
        target: runNodeId,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
      edges.push({
        id: `${runNodeId}-${metricNodeId}`,
        source: runNodeId,
        target: metricNodeId,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    }
  }

  // Compute run nodes
  for (const run of data.computeRuns) {
    const runNodeId = `compute-run-${run.id}`;
    const metricNodeId = `metric-results-${run.id}`;
    const shortId = run.id.substring(0, 8);

    nodes.push({
      id: runNodeId,
      data: { type: 'compute-run', computeRun: run, label: `Run · ${run.status} · ${shortId}`, entityId: run.id },
      position: { x: 0, y: 0 },
      style: getComputeRunStyle(run.status)
    });

    nodes.push({
      id: metricNodeId,
      data: {
        type: 'metric-results',
        metricResults: run.metricResults,
        label: `${run.metricResults.length} Metrics`,
        entityId: run.id
      },
      position: { x: 0, y: 0 },
      style: run.status === 'success' ? GREEN_STYLE : GREY_STYLE
    });

    // If this run is NOT linked to any milestone, draw project → run directly
    if (!linkedRunIds.has(run.id)) {
      edges.push({
        id: `project-${runNodeId}`,
        source: 'project',
        target: runNodeId,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
      edges.push({
        id: `${runNodeId}-${metricNodeId}`,
        source: runNodeId,
        target: metricNodeId,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    }
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
    if (pos) {
      n.position = { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 };
    }
  });

  return { nodes, edges };
}

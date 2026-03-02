/**
 * Thin helpers for creating and resolving ComputeRun + MetricResult records.
 * All three wiring points (test runs, projection milestones, RSP ingest) use these.
 */
import prisma from 'lib/prisma';

/** Returns the most-recently published MethodologySnapshot id, or null if none exist. */
export async function getLatestPublishedSnapshotId(): Promise<string | null> {
  const snap = await prisma.methodologySnapshot.findFirst({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true }
  });
  return snap?.id ?? null;
}

type RunType = 'projection' | 'scenario' | 'test' | 'actuals_ingest' | 'backfill';

/** Creates a ComputeRun in 'running' state and returns its id. */
export async function startComputeRun(opts: {
  runType: RunType;
  orgId?: string;
  projectId?: string;
  methodologySnapshotId?: string | null;
  metadataJson?: object;
}): Promise<string> {
  const run = await prisma.computeRun.create({
    data: {
      runType: opts.runType,
      status: 'running',
      orgId: opts.orgId ?? null,
      projectId: opts.projectId ?? null,
      methodologySnapshotId: opts.methodologySnapshotId ?? null,
      metadataJson: opts.metadataJson ? (opts.metadataJson as any) : undefined,
      startedAt: new Date()
    }
  });
  return run.id;
}

/** Marks an existing ComputeRun as success or failed. */
export async function finishComputeRun(runId: string, status: 'success' | 'failed', errorText?: string): Promise<void> {
  await prisma.computeRun.update({
    where: { id: runId },
    data: { status, finishedAt: new Date(), errorText: errorText ?? null }
  });
}

type MetricResultInput = {
  runId: string;
  orgId?: string;
  projectId?: string;
  metricKey: string;
  valueNumeric: number;
  units: string;
  methodologySnapshotId?: string | null;
};

/** Persists one or more MetricResult rows. */
export async function saveMetricResults(metrics: MetricResultInput[]): Promise<void> {
  if (metrics.length === 0) return;
  await prisma.metricResult.createMany({
    data: metrics.map(m => ({
      runId: m.runId,
      orgId: m.orgId ?? null,
      projectId: m.projectId ?? null,
      metricKey: m.metricKey,
      valueNumeric: m.valueNumeric,
      units: m.units,
      methodologySnapshotId: m.methodologySnapshotId ?? null
    }))
  });
}

import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { BreakEvenChart } from './BreakEvenChart';
import { SnapshotTimeline } from './SnapshotTimeline';

export function ProjectTimeline({ projectId, data }: { projectId: string; data: ProjectionsResponse }) {
  return (
    <div>
      <BreakEvenChart financialResults={data.financialResults} />
      <SnapshotTimeline projectId={projectId} />
    </div>
  );
}

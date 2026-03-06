import type { GetServerSideProps } from 'next';
import type { Org } from '@prisma/client';

import { AnalyticsPage } from 'components/org/analytics/Analytics';
import type { ScenarioMultipliers } from 'components/org/analytics/components/ScenarioPlanner';
import { SharedPageLayout } from 'layouts/SharedPageLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { AllProjectsSummary } from 'lib/calculator/getProjections';

type Props = {
  org: Org;
  data: AllProjectsSummary;
  initialScenarioMultipliers?: ScenarioMultipliers | null;
  initialTimelineYear?: number | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async context => {
  const { slug, scenario, tags, projectTypes, startDate, endDate } = context.query as Record<
    string,
    string | undefined
  >;

  const org = await prisma.org.findUnique({ where: { analyticsSlug: slug } });
  if (!org) return { notFound: true };

  // Decode optional scenario param
  let initialScenarioMultipliers: ScenarioMultipliers | undefined;
  let initialTimelineYear: number | undefined;
  if (scenario) {
    try {
      const decoded = JSON.parse(Buffer.from(scenario, 'base64').toString('utf-8'));
      if (decoded.multipliers) initialScenarioMultipliers = decoded.multipliers;
      if (decoded.timelineYear) initialTimelineYear = decoded.timelineYear;
    } catch {
      // invalid scenario param — ignore
    }
  }

  // Fetch all default projects then apply filter params
  const allProjects = await prisma.project.findMany({
    where: { orgId: org.id, isTemplate: false, category: 'default' },
    include: { account: true, org: true, tags: true }
  });

  const tagIds = tags ? tags.split(',') : undefined;
  const projectTypeIds = projectTypes ? projectTypes.split(',') : undefined;

  const filteredProjects = allProjects.filter(p => {
    if (tagIds && !tagIds.some(id => p.tags.some(t => t.tagId === id))) return false;
    if (projectTypeIds) {
      const pType = (p.metadata as { type?: string } | null)?.type;
      if (!pType || !projectTypeIds.includes(pType)) return false;
    }
    if (startDate || endDate) {
      const d = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
    }
    return true;
  });

  const data = await getAllProjections(filteredProjects);

  return {
    props: serializeJSON({
      org,
      data,
      initialScenarioMultipliers: initialScenarioMultipliers ?? null,
      initialTimelineYear: initialTimelineYear ?? null
    })
  };
};

function PublicAnalyticsPage({ org, data, initialScenarioMultipliers, initialTimelineYear }: Props) {
  const title = `${org.name} | Analytics`;

  const fakeUser = {
    id: '',
    name: '',
    email: '',
    orgId: org.id,
    org: { ...org, analyticsSlug: null }
  } as any;

  return (
    <SharedPageLayout title={title}>
      <div style={{ padding: '24px 32px' }}>
        <AnalyticsPage
          data={data}
          user={fakeUser}
          projectCategory='default'
          availableProjectTypes={[]}
          showCategoryTabs={false}
          isUpstreamView={false}
          isReadOnly
          initialTab={initialScenarioMultipliers ? 'scenarios' : 'projections'}
          initialScenarioMultipliers={initialScenarioMultipliers ?? undefined}
          initialTimelineYear={initialTimelineYear ?? undefined}
        />
      </div>
    </SharedPageLayout>
  );
}

export default PublicAnalyticsPage;

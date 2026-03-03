import type { GetServerSideProps } from 'next';
import type { Org } from '@prisma/client';

import { AnalyticsPage } from 'components/org/analytics/Analytics';
import { SharedPageLayout } from 'layouts/SharedPageLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { AllProjectsSummary } from 'lib/calculator/getProjections';

type Props = {
  org: Org;
  data: AllProjectsSummary;
};

export const getServerSideProps: GetServerSideProps<Props> = async context => {
  const { slug } = context.query as { slug: string };

  const org = await prisma.org.findUnique({ where: { analyticsSlug: slug } });
  if (!org) return { notFound: true };

  const projects = await prisma.project.findMany({
    where: { orgId: org.id, isTemplate: false, category: 'default' },
    include: { account: true, org: true, tags: true }
  });

  const data = await getAllProjections(projects);

  return { props: serializeJSON({ org, data }) };
};

function PublicAnalyticsPage({ org, data }: Props) {
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
        />
      </div>
    </SharedPageLayout>
  );
}

export default PublicAnalyticsPage;

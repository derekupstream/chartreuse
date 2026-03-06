import type { GetServerSideProps } from 'next';
import { ProjectCategory } from '@prisma/client';

import type { PageProps } from 'components/org/analytics/Analytics';
import { AnalyticsPage } from 'components/org/analytics/Analytics';
import { AdminLayout } from 'layouts/AdminLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  const categoryRaw = (context.query.category as ProjectCategory | undefined) || 'default';
  const projectCategory = ProjectCategory[categoryRaw as keyof typeof ProjectCategory] || 'default';

  if (!user?.org.isUpstream) {
    return { notFound: true };
  }

  const [projects, projectsInOtherCategory] = await Promise.all([
    prisma.project.findMany({
      where: { category: projectCategory, isTemplate: false },
      include: { account: true, org: true, tags: true }
    }),
    prisma.project.count({
      where: { category: projectCategory === 'event' ? 'default' : 'event' }
    })
  ]);

  const data = await getAllProjections(projects);

  const availableProjectTypes = Array.from(
    new Set(projects.map(p => (p.metadata as { type?: string } | null)?.type).filter((t): t is string => !!t))
  );

  return {
    props: serializeJSON({
      data,
      user,
      projectCategory,
      showCategoryTabs: projectsInOtherCategory > 0,
      availableProjectTypes
    })
  };
};

const AnalyticsPageComponent = ({
  user,
  data,
  projectCategory,
  showCategoryTabs,
  availableProjectTypes
}: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      isUpstreamView={true}
      projectCategory={projectCategory}
      showCategoryTabs={showCategoryTabs}
      availableProjectTypes={availableProjectTypes}
    />
  );
};

AnalyticsPageComponent.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <AdminLayout {...pageProps} selectedMenuItem='admin/analytics' title='Analytics'>
      {page}
    </AdminLayout>
  );
};

export default AnalyticsPageComponent;

import type { GetServerSideProps } from 'next';

import type { PageProps } from 'components/org/analytics/Analytics';
import { AnalyticsPage } from 'components/org/analytics/Analytics';
import { AdminLayout } from 'layouts/AdminLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { ProjectCategory } from '@prisma/client';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  const categoryRaw = (context.query.category as ProjectCategory | undefined) || 'default';
  const projectCategory = ProjectCategory[categoryRaw as keyof typeof ProjectCategory] || 'default';

  if (!user?.org.isUpstream) {
    return {
      notFound: true
    };
  }

  const [projects, projectsInOtherCategory] = await Promise.all([
    prisma.project.findMany({
      where: {
        category: projectCategory,
        isTemplate: false
      },
      include: {
        account: true,
        org: true
      }
    }),
    prisma.project.count({
      where: {
        category: projectCategory === 'event' ? 'default' : 'event'
      }
    })
  ]);

  const data = await getAllProjections(projects);

  return {
    props: serializeJSON({
      data,
      user,
      projectCategory,
      showCategoryTabs: projectsInOtherCategory > 0
    })
  };
};

const AnalyticsPageComponent = ({ user, data, projectCategory, showCategoryTabs }: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      isUpstreamView={true}
      projectCategory={projectCategory}
      showCategoryTabs={showCategoryTabs}
    />
  );
};

AnalyticsPageComponent.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <AdminLayout {...pageProps} selectedMenuItem='upstream/total-annual-impact' title='Analytics'>
      {page}
    </AdminLayout>
  );
};

export default AnalyticsPageComponent;

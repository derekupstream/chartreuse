import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import type { GetServerSideProps } from 'next';

import type { PageProps, ProjectMeta } from 'components/org/analytics/Analytics';
import { AnalyticsPage } from 'components/org/analytics/Analytics';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import { ProjectCategory } from '@prisma/client';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) {
    return { notFound: true };
  }

  const categoryRaw = (context.query.category as ProjectCategory | undefined) || 'default';
  let projectCategory = ProjectCategory[categoryRaw as keyof typeof ProjectCategory] || 'default';
  const otherCategory = projectCategory === 'event' ? 'default' : 'event';

  let [projects, projectsInOtherCategory] = await Promise.all([
    prisma.project.findMany({
      where: {
        accountId: user.accountId || undefined,
        orgId: user.org.id,
        category: projectCategory,
        isTemplate: false
      },
      include: {
        account: true,
        org: true,
        tags: true
      }
    }),
    prisma.project.count({
      where: {
        accountId: user.accountId || undefined,
        orgId: user.org.id,
        category: otherCategory
      }
    })
  ]);

  // If the org uses event projects by default, swap category
  if (projects.length === 0 && projectsInOtherCategory > 0) {
    [projects, projectsInOtherCategory] = await Promise.all([
      prisma.project.findMany({
        where: {
          accountId: user.accountId || undefined,
          orgId: user.org.id,
          category: otherCategory,
          isTemplate: false
        },
        include: {
          account: true,
          org: true,
          tags: true
        }
      }),
      prisma.project.count({
        where: {
          accountId: user.accountId || undefined,
          orgId: user.org.id,
          category: projectCategory
        }
      })
    ]);
    projectCategory = 'event';
  }

  // Pass ALL projects to getAllProjections — filtering is done client-side
  const data = await getAllProjections(projects);

  // Per-project metadata for client-side filtering
  const projectMetadata: Record<string, ProjectMeta> = {};
  projects.forEach(p => {
    projectMetadata[p.id] = {
      accountId: p.accountId,
      tagIds: p.tags.map(t => t.tagId),
      USState: p.USState || null,
      startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null
    };
  });

  return {
    props: serializeJSON({
      projectMetadata,
      projectCategory,
      showCategoryTabs: projectsInOtherCategory > 0,
      data,
      user,
      org: user.org
    })
  };
};

const AnalyticsPageComponent = ({ projectMetadata, projectCategory, data, user, showCategoryTabs }: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      projectMetadata={projectMetadata}
      projectCategory={projectCategory}
      showCategoryTabs={showCategoryTabs}
    />
  );
};

AnalyticsPageComponent.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem='org/analytics' title='Analytics'>
      {page}
    </Template>
  );
};

export default AnalyticsPageComponent;

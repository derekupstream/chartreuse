import type { GetServerSideProps } from 'next';

import type { PageProps } from 'components/org/analytics/Analytics';
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
    return {
      notFound: true
    };
  }

  const tagIds = (context.query.tags as string | undefined)?.split(',');
  const projectTypeIds = (context.query.projectTypes as string | undefined)?.split(',');
  const startDate = context.query.startDate as string | undefined;
  const endDate = context.query.endDate as string | undefined;
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

  // org uses event projects by default
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

  const filteredProjects = projects.filter(p => {
    // Tag filter
    if (tagIds) {
      if (!tagIds.some(id => p.tags.some(t => t.tagId === id))) return false;
    }
    // Project type filter (stored in metadata.type)
    if (projectTypeIds) {
      const pType = (p.metadata as { type?: string } | null)?.type;
      if (!pType || !projectTypeIds.includes(pType)) return false;
    }
    // Date range filter — use startDate if set, otherwise fall back to createdAt
    if (startDate || endDate) {
      const projectDate = p.startDate ? new Date(p.startDate) : new Date(p.createdAt);
      if (startDate && projectDate < new Date(startDate)) return false;
      if (endDate && projectDate > new Date(endDate)) return false;
    }
    return true;
  });

  const data = await getAllProjections(filteredProjects);

  const availableProjectTypes = Array.from(
    new Set(projects.map(p => (p.metadata as { type?: string } | null)?.type).filter((t): t is string => !!t))
  ).sort();

  return {
    props: serializeJSON({
      availableProjectTypes,
      projectCategory,
      showCategoryTabs: projectsInOtherCategory > 0,
      data,
      user,
      org: user.org
    })
  };
};

const AnalyticsPageComponent = ({
  availableProjectTypes,
  projectCategory,
  data,
  user,
  showCategoryTabs
}: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      availableProjectTypes={availableProjectTypes}
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

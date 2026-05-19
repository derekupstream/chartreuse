import type { GetServerSideProps } from 'next';
import { ProjectCategory } from '@prisma/client';

import type { PageProps } from 'components/org/analytics/Analytics';
import { AnalyticsPage } from 'components/org/analytics/Analytics';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) return { notFound: true };

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
      include: { account: true, org: true, tags: true }
    }),
    prisma.project.count({
      where: {
        accountId: user.accountId || undefined,
        orgId: user.org.id,
        category: otherCategory
      }
    })
  ]);

  // Some orgs run mostly event projects — fall back so the tab actually has data.
  if (projects.length === 0 && projectsInOtherCategory > 0) {
    [projects, projectsInOtherCategory] = await Promise.all([
      prisma.project.findMany({
        where: {
          accountId: user.accountId || undefined,
          orgId: user.org.id,
          category: otherCategory,
          isTemplate: false
        },
        include: { account: true, org: true, tags: true }
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
    if (tagIds) {
      if (!tagIds.some(id => p.tags.some(t => t.tagId === id))) return false;
    }
    if (projectTypeIds) {
      const pType = (p.metadata as { type?: string } | null)?.type;
      if (!pType || !projectTypeIds.includes(pType)) return false;
    }
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
      org: user.org,
      initialTab: 'scenarios'
    })
  };
};

const ScenariosPage = ({
  availableProjectTypes,
  projectCategory,
  data,
  user,
  showCategoryTabs,
  initialTab
}: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      availableProjectTypes={availableProjectTypes}
      projectCategory={projectCategory}
      showCategoryTabs={showCategoryTabs}
      initialTab={initialTab ?? 'scenarios'}
    />
  );
};

ScenariosPage.getLayout = (page: React.ReactNode, pageProps: any) => (
  <Template {...pageProps} selectedMenuItem='scenarios' title='Scenarios'>
    {page}
  </Template>
);

export default ScenariosPage;

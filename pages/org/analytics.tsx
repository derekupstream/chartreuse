import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
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

  const accountIds = (context.query.accounts as string | undefined)?.split(',');
  const projectIds = (context.query.projects as string | undefined)?.split(',');
  const tagIds = (context.query.tags as string | undefined)?.split(',');
  const stateIds = (context.query.states as string | undefined)?.split(',');
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
    // Account / project filter (OR between account and project)
    if (accountIds || projectIds) {
      const matchesAccount = accountIds ? accountIds.includes(p.accountId) : false;
      const matchesProject = projectIds ? projectIds.includes(p.id) : false;
      if (!matchesAccount && !matchesProject) return false;
    }
    // Tag filter
    if (tagIds) {
      if (!tagIds.some(id => p.tags.some(t => t.tagId === id))) return false;
    }
    // State filter
    if (stateIds) {
      if (!stateIds.includes(p.USState || '')) return false;
    }
    // Date range filter (based on project startDate)
    if (startDate) {
      const filterStart = new Date(startDate);
      if (p.startDate && new Date(p.startDate) < filterStart) return false;
    }
    if (endDate) {
      const filterEnd = new Date(endDate);
      if (p.startDate && new Date(p.startDate) > filterEnd) return false;
    }
    return true;
  });

  const data = await getAllProjections(filteredProjects);

  const allAccounts = sortBy(
    uniqBy(
      projects.map(p => ({ id: p.accountId, name: p.account.name })),
      'id'
    ),
    'name'
  );
  const allProjects = sortBy(
    projects
      .map(p => ({ id: p.id, accountId: p.accountId, name: `${p.account.name}: ${p.name}`, tags: p.tags }))
      .filter(p => (accountIds ? !accountIds.includes(p.accountId) : true))
      .filter(p => (tagIds ? !tagIds.some(id => p.tags.some(t => t.tagId === id)) : true)),
    'name'
  );

  // Available states across all (unfiltered) projects for the state filter dropdown
  const availableStates = Array.from(new Set(projects.map(p => p.USState).filter((s): s is string => !!s))).sort();

  return {
    props: serializeJSON({
      allAccounts,
      allProjects,
      availableStates,
      projectCategory,
      showCategoryTabs: projectsInOtherCategory > 0,
      data,
      user,
      org: user.org
    })
  };
};

const AnalyticsPageComponent = ({
  allAccounts,
  projectCategory,
  allProjects,
  availableStates,
  data,
  user,
  showCategoryTabs
}: PageProps) => {
  return (
    <AnalyticsPage
      data={data}
      user={user}
      allAccounts={allAccounts}
      allProjects={allProjects}
      availableStates={availableStates}
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

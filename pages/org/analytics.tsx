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
        org: true
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

  console.log('projectsInOtherCategory', projects.length, projectsInOtherCategory);

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
          org: true
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
    if (accountIds || projectIds) {
      return accountIds?.includes(p.accountId) || projectIds?.includes(p.id);
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
      .map(p => ({ id: p.id, accountId: p.accountId, name: `${p.account.name}: ${p.name}` }))
      // remove projects included already in the account filter
      .filter(p => (accountIds ? !accountIds.includes(p.accountId) : true)),
    'name'
  );

  return {
    props: serializeJSON({
      allAccounts,
      allProjects,
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

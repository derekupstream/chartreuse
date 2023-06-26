import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import type { GetServerSideProps } from 'next';

import type { PageProps } from 'components/analytics/Analytics';
import Analytics from 'components/analytics/Analytics';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) {
    return {
      notFound: true
    };
  }

  const accountIds = (context.query.accounts as string | undefined)?.split(',');
  const projectIds = (context.query.projects as string | undefined)?.split(',');
  const projects = await prisma.project.findMany({
    where: {
      accountId: user.accountId || undefined,
      orgId: user.org.id
    },
    include: {
      account: true,
      org: true
    }
  });
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
    props: {
      allAccounts,
      allProjects,
      data,
      user
    }
  };
};

const AnalyticsPage = ({ allAccounts, allProjects, data, user }: PageProps) => {
  return <Analytics allAccounts={allAccounts} allProjects={allProjects} data={data} user={user} />;
};

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem='org-analytics' title='Analytics'>
      {page}
    </Template>
  );
};

export default AnalyticsPage;

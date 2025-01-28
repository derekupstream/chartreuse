import sortBy from 'lodash/sortBy';
import uniqBy from 'lodash/uniqBy';
import type { GetServerSideProps } from 'next';

import type { PageProps } from 'components/org/analytics/Analytics';
import Analytics from 'components/org/analytics/Analytics';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });

  const accountIds = (context.query.accounts as string | undefined)?.split(',');
  const projectIds = (context.query.projects as string | undefined)?.split(',');

  if (!user?.org.isUpstream) {
    return {
      notFound: true
    };
  }

  const projects = await prisma.project.findMany({
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
    props: serializeJSON({
      allAccounts,
      allProjects,
      data,
      user
    })
  };
};

const AnalyticsPage = ({ user, data, allAccounts, allProjects }: PageProps) => {
  return (
    <Analytics allAccounts={allAccounts} allProjects={allProjects} data={data} user={user} isUpstreamView={true} />
  );
};

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem='upstream/total-annual-impact' title='Analytics'>
      {page}
    </Template>
  );
};

export default AnalyticsPage;

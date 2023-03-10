import type { GetServerSideProps } from 'next';
import useSWR from 'swr';

import type { PageProps } from 'components/dashboard/analytics';
import Analytics from 'components/dashboard/analytics';
import Template from 'layouts/dashboardLayout';
import { getAllProjections } from 'lib/calculator/getProjections';
import chartreuseClient from 'lib/chartreuseClient';
import { getUserFromContext } from 'lib/middleware';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) {
    return {
      notFound: true
    };
  }

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
  const filteredProjects = projectIds ? projects.filter(p => projectIds.includes(p.id)) : projects;
  const data = await getAllProjections(filteredProjects);

  return {
    props: {
      allProjects: projects.map(p => ({ id: p.id, name: `${p.org.name} - ${p.account.name}: ${p.name}` })),
      data,
      user
    }
  };
};

const AnalyticsPage = ({ allProjects, data, user }: PageProps) => {
  return <Analytics allProjects={allProjects} data={data} user={user} />;
};

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem='org-analytics' title='Analytics'>
      {page}
    </Template>
  );
};

export default AnalyticsPage;

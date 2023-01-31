import type { GetServerSideProps } from 'next';
import useSWR from 'swr';

import type { PageProps } from 'components/dashboard/analytics';
import Analytics from 'components/dashboard/analytics';
import Template from 'layouts/dashboardLayout';
import chartreuseClient from 'lib/chartreuseClient';
import { getUserFromContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user) {
    return {
      notFound: true
    };
  }
  return {
    props: {
      user
    }
  };
};

const AnalyticsPage = ({ user }: PageProps) => {
  const { data } = useSWR('/projections', () => chartreuseClient.getProjectSummaries());
  return <Analytics data={data} user={user} />;
};

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem='org-analytics' title='Analytics'>
      {page}
    </Template>
  );
};

export default AnalyticsPage;

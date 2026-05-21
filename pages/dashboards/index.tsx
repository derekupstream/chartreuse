import type { GetServerSideProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { ProjectsDashboard } from 'components/projects/ProjectsDashboard';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { LoggedinProps } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

type DashboardsPageProps = LoggedinProps & {
  query?: ParsedUrlQuery;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  (response.props as DashboardsPageProps).query = context.query;
  return { ...response };
};

const DashboardsPage = ({ user, query }: DashboardsPageProps) => {
  return (
    <ProjectsDashboard
      orgId={user.org.id}
      isUpstream={user.org.isUpstream}
      showTemplateByDefault={query?.view === 'templates'}
      mode='dashboards'
    />
  );
};

DashboardsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='dashboards' title='Dashboards'>
      {page}
    </Template>
  );
};

export default DashboardsPage;

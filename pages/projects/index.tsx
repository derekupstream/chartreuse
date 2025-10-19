import type { GetServerSideProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { ProjectsDashboard } from 'components/projects/ProjectsDashboard';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { LoggedinProps } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

type ProjectsPageProps = LoggedinProps & {
  query?: ParsedUrlQuery;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  (response.props as ProjectsPageProps).query = context.query;
  return { ...response };
};

const ProjectsPage = ({ user, query }: ProjectsPageProps) => {
  return (
    <ProjectsDashboard
      orgId={user.org.id}
      isUpstream={user.org.isUpstream}
      showTemplateByDefault={query?.view === 'templates'}
    />
  );
};

ProjectsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      {page}
    </Template>
  );
};

export default ProjectsPage;

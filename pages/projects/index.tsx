import type { GetServerSideProps } from 'next';

import { ProjectsDashboard } from 'components/projects/ProjectsDashboard';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { LoggedinProps } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const ProjectsPage = ({ user }: LoggedinProps) => {
  return <ProjectsDashboard orgId={user.orgId} />;
};

ProjectsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      {page}
    </Template>
  );
};

export default ProjectsPage;

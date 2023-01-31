import type { GetServerSideProps } from 'next';

import Projects from 'components/dashboard/projects';
import Template from 'layouts/dashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const ProjectsPage = () => {
  return <Projects />;
};

ProjectsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      {page}
    </Template>
  );
};

export default ProjectsPage;

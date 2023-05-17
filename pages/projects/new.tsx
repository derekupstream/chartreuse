import type { GetServerSideProps } from 'next';

import { ProjectSetup } from 'components/projects/[id]/edit';
import type { DashboardProps } from 'layouts/dashboardLayout';
import Template from 'layouts/dashboardLayout';
import { checkLogin } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const NewProjectPage = (pageProps: DashboardProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      <ProjectSetup user={pageProps.user} successPath={pid => `/projects/${pid}/single-use-items`} />
    </Template>
  );
};

export default NewProjectPage;

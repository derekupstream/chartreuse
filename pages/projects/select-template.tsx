import type { GetServerSideProps } from 'next';

import type { DashboardProps } from 'layouts/DashboardLayout/DashboardLayout';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const NewProjectPage = (pageProps: DashboardProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      select a template
    </Template>
  );
};

export default NewProjectPage;

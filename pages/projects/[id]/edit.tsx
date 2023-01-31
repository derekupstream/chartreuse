import type { Project } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'components/dashboard';
import ProjectSetup from 'components/projects/[id]/edit';
import Template from 'layouts/dashboardLayout';
import { BackToProjectsButton } from 'layouts/projectLayout';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

export default function SetupPage(pageProps: { user: DashboardUser; project?: Project }) {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <BackToProjectsButton />
      </div>
      <ProjectSetup user={pageProps.user} project={pageProps.project} successPath={() => '/projects'} />
    </Template>
  );
}

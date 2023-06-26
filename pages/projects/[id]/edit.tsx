import type { Project } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import { ProjectSetup } from 'components/projects/[id]/edit';
import type { DashboardUser } from 'interfaces';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

export default function SetupPage(pageProps: { user: DashboardUser; project?: Project }) {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      <ProjectSetup user={pageProps.user} project={pageProps.project} successPath={() => '/projects'} />
    </Template>
  );
}

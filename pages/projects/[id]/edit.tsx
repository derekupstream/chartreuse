import type { Project } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import { ProjectSetup } from 'components/projects/[id]/edit/ProjectSetup';
import type { DashboardUser } from 'interfaces';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { getProjectContext } from 'lib/middleware';

type PageProps = { user: DashboardUser; project?: Project };

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await getProjectContext(context);
  return { ...response };
};

export default function SetupPage(pageProps: PageProps) {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      <ProjectSetup
        actionLabel='Update project'
        user={pageProps.user}
        project={pageProps.project}
        successPath={() => '/projects'}
      />
    </Template>
  );
}

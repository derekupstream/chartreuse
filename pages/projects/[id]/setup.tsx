import type { Project } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import ProjectSetup from 'components/calculator/setup';
import type { DashboardUser } from 'components/dashboard';
import ProjectLayout from 'layouts/projectLayout';
import { getProjectContext, ProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

export default function SetupPage({ user, project }: { user: DashboardUser; project?: Project }) {
  return (
    <ProjectLayout currentStepIndex={0} user={user} project={project} title={`Project Setup`}>
      <ProjectSetup user={user} project={project} />
    </ProjectLayout>
  );
}

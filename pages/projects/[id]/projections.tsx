import type { GetServerSideProps } from 'next';

import Projections from 'components/projects/[id]/projections';
import { ProjectStepsLayout } from 'layouts/projectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function ProjectionsPage({ project, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={3} project={project} title={`${project.name} - Projections`} user={user}>
      <Projections project={project} />
    </ProjectStepsLayout>
  );
}

export default ProjectionsPage;

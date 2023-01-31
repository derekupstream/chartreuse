import type { GetServerSideProps } from 'next';

import Projections from 'components/calculator/projections';
import ProjectLayout from 'layouts/projectLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function ProjectionsPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={3} project={project} title={`${project.name} - Projections`} user={user}>
      <Projections project={project} />
    </ProjectLayout>
  );
}

export default ProjectionsPage;

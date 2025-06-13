import type { GetServerSideProps } from 'next';

import { ProjectionsStep } from 'components/projects/[id]/projections/ProjectionsStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function ProjectionsPage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={0} project={project} title={`${project.name} - Projections`} user={user}>
      <ProjectionsStep project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default ProjectionsPage;

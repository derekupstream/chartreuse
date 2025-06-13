import type { GetServerSideProps } from 'next';

import { TransportationStep } from 'components/projects/[id]/transportation/TransportationStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function AdditionalCostsPage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={4} project={project} title={`${project.name} - Transportation`} user={user}>
      <TransportationStep project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default AdditionalCostsPage;

import type { GetServerSideProps } from 'next';

import { AdditionalCostsStep } from 'components/projects/[id]/additional-costs/AdditionalCostsStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function AdditionalCostsPage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={4} project={project} title={`${project.name} - Additional Costs`} user={user}>
      <AdditionalCostsStep project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default AdditionalCostsPage;

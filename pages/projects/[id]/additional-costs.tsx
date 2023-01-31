import type { GetServerSideProps } from 'next';

import AdditionalCosts from 'components/calculator/additional-costs';
import ProjectLayout from 'layouts/projectLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function AdditionalCostsPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={3} project={project} title={`${project.name} - Additional Costs`} user={user}>
      <AdditionalCosts project={project} />
    </ProjectLayout>
  );
}

export default AdditionalCostsPage;

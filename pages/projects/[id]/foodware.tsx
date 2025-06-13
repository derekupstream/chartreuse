import type { GetServerSideProps } from 'next';

import { FoodwareStep } from 'components/projects/[id]/foodware/FoodwareStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function FoodwarePage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={1} project={project} title={`${project.name} - Foodware`} user={user}>
      <FoodwareStep readOnly={readOnly} project={project} />
    </ProjectStepsLayout>
  );
}

export default FoodwarePage;

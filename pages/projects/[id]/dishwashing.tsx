import type { GetServerSideProps } from 'next';

import { DishwashingStep } from 'components/projects/[id]/dishwashing/DishwashingStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function DishwashingPage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={3} project={project} title={`${project.name} - Dishwashing`} user={user}>
      <DishwashingStep project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default DishwashingPage;

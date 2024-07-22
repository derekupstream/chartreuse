import type { GetServerSideProps } from 'next';

import { DishwashingView } from 'components/projects/[id]/dishwashing';
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
      <DishwashingView project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default DishwashingPage;

import type { GetServerSideProps } from 'next';

import SingleUse from 'components/projects/[id]/single-use';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function SingleUsePage({ project, user, readOnly }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={1} project={project} title={`${project.name} - Single Use Items`} user={user}>
      <SingleUse project={project!} user={user} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default SingleUsePage;

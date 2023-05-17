import type { GetServerSideProps } from 'next';

import SingleUse from 'components/projects/[id]/single-use';
import { ProjectStepsLayout } from 'layouts/projectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function SingleUsePage({ project, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={0} project={project} title={`${project.name} - Single Use Items`} user={user}>
      <SingleUse project={project!} user={user} />
    </ProjectStepsLayout>
  );
}

export default SingleUsePage;

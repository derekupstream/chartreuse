import type { GetServerSideProps } from 'next';

import SingleUse from 'components/projects/[id]/single-use';
import ProjectLayout from 'layouts/projectLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function SingleUsePage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={0} project={project} title={`${project.name} - Single Use Items`} user={user}>
      <SingleUse project={project!} user={user} />
    </ProjectLayout>
  );
}

export default SingleUsePage;

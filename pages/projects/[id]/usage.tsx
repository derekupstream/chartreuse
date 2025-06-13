import type { GetServerSideProps } from 'next';

import { UsageStep } from 'components/projects/[id]/usage/UsageStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function UsagePage({ project, readOnly, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={2} project={project} title={`${project.name} - Usage`} user={user}>
      <UsageStep readOnly={readOnly} project={project} />
    </ProjectStepsLayout>
  );
}

export default UsagePage;

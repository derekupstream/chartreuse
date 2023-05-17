import type { GetServerSideProps } from 'next';

import { PurchasingUpdates } from 'components/projects/[id]/purchasing-updates/purchasing-updates';
import { ProjectStepsLayout } from 'layouts/projectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function PurchasingUpdatesPage({ project, user }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={4} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <PurchasingUpdates project={project} />
    </ProjectStepsLayout>
  );
}

export default PurchasingUpdatesPage;

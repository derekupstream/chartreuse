import type { GetServerSideProps } from 'next';

import { PurchasingUpdates } from 'components/projects/[id]/purchasing-updates/PurchasingUpdates';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function PurchasingUpdatesPage({ project, user, readOnly }: ProjectContext) {
  return (
    <ProjectStepsLayout currentStepIndex={10} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <PurchasingUpdates project={project} readOnly={readOnly} />
    </ProjectStepsLayout>
  );
}

export default PurchasingUpdatesPage;

import type { GetServerSideProps } from 'next';
import ReactToPrint from 'react-to-print';

import { PurchasingUpdates } from 'components/projects/[id]/purchasing-updates/purchasing-updates';
import ProjectLayout from 'layouts/projectLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function PurchasingUpdatesPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={4} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <PurchasingUpdates project={project} />
    </ProjectLayout>
  );
}

export default PurchasingUpdatesPage;

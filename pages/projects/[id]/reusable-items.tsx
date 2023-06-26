import type { GetServerSideProps } from 'next';
import { useEffect } from 'react';

import ReusablesPurchasing from 'components/projects/[id]/reusable-purchasing';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import chartreuseClient from 'lib/chartreuseClient';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function ReusablesPurchasingPage({ project, user }: ProjectContext) {
  useEffect(() => {
    chartreuseClient.sendMailchimpEvent('completed_single_use_step');
  }, []);

  return (
    <ProjectStepsLayout currentStepIndex={1} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <ReusablesPurchasing />
    </ProjectStepsLayout>
  );
}

export default ReusablesPurchasingPage;

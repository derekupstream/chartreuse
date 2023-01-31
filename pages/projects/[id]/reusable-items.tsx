import type { GetServerSideProps } from 'next';
import { useEffect } from 'react';

import ReusablesPurchasing from 'components/calculator/reusable-purchasing';
import ProjectLayout from 'layouts/projectLayout';
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
    <ProjectLayout currentStepIndex={1} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <ReusablesPurchasing />
    </ProjectLayout>
  );
}

export default ReusablesPurchasingPage;

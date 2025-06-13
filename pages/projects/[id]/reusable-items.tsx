import type { GetServerSideProps } from 'next';
import { useEffect } from 'react';

import { ReusablePurchasingStep } from 'components/projects/[id]/reusable-purchasing/ReusablePurchasingStep';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import chartreuseClient from 'lib/chartreuseClient';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function ReusablesPurchasingPage({ project, user, readOnly }: ProjectContext) {
  useEffect(() => {
    chartreuseClient.sendMailchimpEvent('completed_single_use_step');
  }, []);

  return (
    <ProjectStepsLayout currentStepIndex={2} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <ReusablePurchasingStep readOnly={readOnly} isUpstream={!!project.org.isUpstream} />
    </ProjectStepsLayout>
  );
}

export default ReusablesPurchasingPage;

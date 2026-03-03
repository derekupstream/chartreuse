import type { GetServerSideProps } from 'next';
import { useState } from 'react';

import { ProjectSettingsPage } from 'components/projects/[id]/settings/ProjectSettingsPage';
import { ProjectStepsLayout } from 'layouts/ProjectStepsLayout';
import type { ProjectContext } from 'lib/middleware';
import { getProjectContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return getProjectContext(context);
};

function SettingsPage({ project, user }: ProjectContext) {
  const [publicSlug, setPublicSlug] = useState(project.publicSlug ?? null);

  return (
    <ProjectStepsLayout currentStepIndex={0} project={project} title={`${project.name} - Settings`} user={user}>
      <ProjectSettingsPage projectId={project.id} publicSlug={publicSlug} onPublicSlugChange={setPublicSlug} />
    </ProjectStepsLayout>
  );
}

export default SettingsPage;

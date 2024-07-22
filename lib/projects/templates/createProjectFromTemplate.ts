import prisma from 'lib/prisma';

import { duplicateProject } from '../duplicateProject';

// create a project based on another one that has been marked as a template
export async function createProjectFromTemplate({ orgId, projectId }: { orgId: string; projectId: string }) {
  // find the first account in the org.. TODO: maybe let users select account?
  const firstAccount = await prisma.account.findFirst({
    where: {
      orgId
    }
  });
  // assert that the project is a template
  await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId,
      isTemplate: true
    }
  });
  const project = await duplicateProject({
    id: projectId,
    skipCopySuffix: true,
    skipTemplateProperties: true,
    targetAccountId: firstAccount?.id,
    targetOrgId: orgId
  });
  return project;
}

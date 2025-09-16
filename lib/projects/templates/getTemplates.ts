import type { Project } from '@prisma/client';
import { isEventProjectsEnabledForOrg } from 'lib/isEventProjectsEnabledForOrg';
import prisma from 'lib/prisma';

// import { TEMPLATES } from './config';
// const templates = process.env.NODE_ENV === 'production' ? TEMPLATES.production : TEMPLATES.dev;

export async function getTemplates({ orgId }: { orgId: string }): Promise<Project[]> {
  const isEventProjectsEnabled = await isEventProjectsEnabledForOrg({ orgId });

  const templates = await prisma.project.findMany({
    where: {
      isTemplate: true,
      category: isEventProjectsEnabled
        ? undefined
        : {
            not: 'event'
          }
    }
  });
  return templates.map(template => ({
    ...template,
    title: template.name
  }));
  // return templates.map(template => ({ ...template, description: 'This is a description' }));
}

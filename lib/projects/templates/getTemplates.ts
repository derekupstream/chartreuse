import type { Project } from '@prisma/client';

import prisma from 'lib/prisma';

// import { TEMPLATES } from './config';
// const templates = process.env.NODE_ENV === 'production' ? TEMPLATES.production : TEMPLATES.dev;

export async function getTemplates(): Promise<Project[]> {
  const templates = await prisma.project.findMany({
    where: {
      isTemplate: true
    }
  });
  return templates.map(template => ({
    ...template,
    title: template.name
  }));
  // return templates.map(template => ({ ...template, description: 'This is a description' }));
}

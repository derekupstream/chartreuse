import { getProjections } from 'lib/calculator/getProjections';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';

import { ProjectCategory } from '@prisma/client';

export type ProjectProjection = {
  slug: string;
  projections: ProjectionsResponse;
  projectCategory: ProjectCategory;
  templateParams: { projectId: string; slug: string };
};

export async function getSharedProjectBySlug(publicSlug: string) {
  const project = await prisma.project.findFirstOrThrow({
    where: {
      publicSlug
    },
    select: {
      id: true,
      orgId: true,
      publicSlug: true,
      category: true,
      projectionsTitle: true,
      projectionsDescription: true
    }
  });

  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: project.orgId
    },
    include: {
      projects: {
        include: {
          account: true,
          org: true
        }
      }
    }
  });

  const projections = {
    projections: await getProjections(project.id),
    slug: publicSlug,
    projectCategory: project.category,
    templateParams: { projectId: project.id, slug: publicSlug }
  };

  return { org, project, projections: projections };
}

import { getProjections } from 'lib/calculator/getProjections';
import prisma from 'lib/prisma';

import { pages } from './config';

export async function getSharedPage(slug: string) {
  const pageConfig = pages.find(p => p.slug === slug);
  if (!pageConfig) throw new Error('No shared page config found for slug: ' + slug);

  console.log('Looking up shared page', { slug, title: pageConfig.title });
  const org = await prisma.org.findFirstOrThrow({
    where: {
      id: pageConfig.orgId
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

  // For now, dont fail if we dont find one of the projects
  const projects = pageConfig.data.map(({ project, slug }) => ({
    slug,
    project: org.projects.find(p => p.name === project)
  }));
  const projections = await Promise.all(
    projects.map(async ({ slug, project }) => {
      if (project) {
        const projections = await getProjections(project.id);
        return { projections, project, slug };
      }
      return null;
    })
  );
  if (!projections.some(Boolean)) {
    throw new Error('No projects found for shared page');
  }

  return { org, projects: projections };
}

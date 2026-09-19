import { getProjections } from 'lib/calculator/getProjections';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import { CANADA_AVERAGE_RATES } from 'lib/calculator/constants/utilities';
import prisma from 'lib/prisma';

export type ShareCountry = 'us' | 'canada';

export function parseShareCountry(value: unknown): ShareCountry {
  return typeof value === 'string' && value.toLowerCase() === 'canada' ? 'canada' : 'us';
}

import { pages } from './config';
import { ProjectCategory } from '@prisma/client';

export type ProjectProjection = {
  slug: string;
  projections: ProjectionsResponse;
  projectCategory: ProjectCategory;
  templateParams: { projectId: string; slug: string };
  recommendations?: any;
  showRecommendations?: boolean;
};

export async function getSharedProjections(slug: string, country: ShareCountry = 'us') {
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
  const projects = pageConfig.templates.map(({ projectId, slug }) => ({
    slug,
    project: org.projects.find(p => p.id === projectId)
  }));
  const projections = await Promise.all(
    projects.map(async ({ slug, project }): Promise<ProjectProjection | null> => {
      if (project) {
        // Canada view: same template businesses, priced with Canada-average utility
        // rates (C$) instead of the template project's US state rates.
        const projections = await getProjections(
          project.id,
          country === 'canada' ? { utilityRates: CANADA_AVERAGE_RATES } : undefined
        );
        return {
          projections,
          slug,
          projectCategory: project.category,
          templateParams: { projectId: project.id, slug },
          recommendations: project.recommendations,
          showRecommendations: project.showRecommendations
        };
      }
      return null;
    })
  );
  if (!projections.some(Boolean)) {
    throw new Error('No projects found for shared page');
  }

  // The Canada view displays in Canadian dollars and metric units — the app shell reads
  // both from the serialized org (pages/_app.tsx providers).
  const displayOrg = country === 'canada' ? { ...org, currency: 'CAD', useMetricSystem: true } : org;

  return { org: displayOrg, projects: projections, country };
}

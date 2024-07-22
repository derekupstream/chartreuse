import type { Project } from '@prisma/client';

import type { PopulatedProject } from 'pages/api/projects/index';

import { useDELETE, useGET, usePOST } from './helpers';

export function useGetProjects() {
  return useGET<{ projects: PopulatedProject[] }>('/api/projects');
}

export function useGetProjectTemplates() {
  return useGET<Project[]>('/api/project-templates');
}

export function useCopyProject() {
  return usePOST<{ id: string }>(`/api/projects/duplicate`);
}

export function useDeleteProject() {
  return useDELETE<{ id: string }>(`/api/projects`);
}

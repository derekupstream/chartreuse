import type { Project, TruckTransportationCost } from '@prisma/client';
import type { ReusableLineItem } from 'lib/inventory/types/projects';
import type { SingleUseLineItem } from 'lib/inventory/types/projects';
import type { PopulatedProject } from 'pages/api/projects/index';
import type { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';
import { useDELETE, useGET, usePOST, usePUT } from './helpers';
import { ModifyFoodwareLineItemRequest } from 'pages/api/projects/[id]/foodware-items';
import { UpdateProjectUsageRequest } from 'pages/api/projects/[id]/usage';
import { ProjectShareRequest } from 'pages/api/projects/[id]/share';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';

type MaybeString = string | undefined;

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

export function useUpdateProjectUsage(projectId: MaybeString) {
  return usePUT<UpdateProjectUsageRequest>(`/api/projects/${projectId}/usage`);
}

export function useGetProjections(projectId?: string) {
  return useGET<ProjectionsResponse>(projectId ? '/api/projects/' + projectId + '/projections' : null);
}

export function useGetFoodwareLineItems(projectId: MaybeString) {
  return useGET<FoodwareLineItem[]>(projectId ? `/api/projects/${projectId}/foodware-items` : null);
}

export function useAddOrUpdateFoodwareLineItem(projectId: string) {
  return usePOST<ModifyFoodwareLineItemRequest>(`/api/projects/${projectId}/foodware-items`);
}

export function useGetReusableLineItems(projectId: MaybeString) {
  return useGET<ReusableLineItem[]>(projectId ? `/api/projects/${projectId}/reusable-items` : null);
}

export function useGetSingleUseLineItems(projectId: MaybeString) {
  return useGET<SingleUseLineItem[]>(projectId ? `/api/projects/${projectId}/single-use-items` : null);
}

export function useGetTruckTransportationCosts(projectId: MaybeString) {
  return useGET<TruckTransportationCost[]>(projectId ? `/api/projects/${projectId}/truck-transportation` : null);
}

export function useAddOrUpdateTruckTransportationCost(projectId: MaybeString) {
  return usePOST<Pick<TruckTransportationCost, 'distanceInMiles' & { id?: string }>>(
    `/api/projects/${projectId}/truck-transportation`
  );
}

export function useDeleteTruckTransportationCost(projectId: MaybeString) {
  return useDELETE<{ id: string }>(`/api/projects/${projectId}/truck-transportation`);
}

export function useToggleShareProject(projectId: MaybeString) {
  return usePUT<ProjectShareRequest>(`/api/projects/${projectId}/share`);
}

export function useUpdateProjections(projectId: MaybeString) {
  return usePUT<{
    projectionsTitle?: string | null;
    projectionsDescription?: string | null;
    recommendations?: any;
    showRecommendations?: boolean;
  }>(`/api/projects/${projectId}/projections`);
}

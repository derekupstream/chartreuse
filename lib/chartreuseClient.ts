import type { Project } from '@prisma/client';

import type { InventoryInput } from 'lib/inventory/saveInventoryRecords';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import type { ReusableLineItem, SingleUseLineItem } from 'lib/inventory/types/projects';
import type { MailChimpEvent } from 'lib/mailchimp/sendEvent';
import type { RequestBody as OrganizationInput } from 'pages/api/org/index';
import type { RequestBody as UpdateOrganizationInput } from 'pages/api/org/[orgId]/index';
import type { UserProfile } from 'pages/api/profile/[id]';

import * as http from './http';

export type AccountSetupFields = {
  name: string;
  email: string;
};

export type ProjectInput = {
  id?: string;
  name: string;
  metadata: any;
  accountId: string;
  orgId: string;
  USState: string | null;
  currency: string | null;
  budget?: number;
  templateDescription?: string;
  isTemplate?: boolean;

  utilityRates: {
    water: number;
    gas: number;
    electric: number;
  } | null;
};

export type InviteMemberInput = {
  email: string;
  accountId?: string;
  orgId: string;
  userId: string;
};

export type CreateProfileInput = {
  id: string;
  email: string;
  orgId: string;
  accountId?: string;
  inviteId: string;
  title?: string;
  name?: string;
  phone?: string;
};

class Client {
  setupOrganization(org: OrganizationInput) {
    return http.POST('/api/org', org);
  }

  updateOrganization(id: string, org: UpdateOrganizationInput) {
    return http.POST('/api/org/' + id, org);
  }

  deleteOrganization(orgId: string) {
    return http.DELETE('/api/org/' + orgId);
  }

  createAccount(account: AccountSetupFields) {
    return http.POST<{ invitedUser: true }>('/api/account', account);
  }

  createProfile(profile: CreateProfileInput) {
    return http.POST('/api/profile', profile);
  }

  inviteMember(user: any) {
    return http.POST('/api/invite', user);
  }

  updateAccount(account: { id: string; name: string }) {
    return http.PUT('/api/account/' + account.id, account);
  }

  getLoggedInUser() {
    return http.GET<{ user?: UserProfile }>('/api/user');
  }

  updateProfile(profile: { id: string; name: string }) {
    return http.PUT('/api/profile/' + profile.id, profile);
  }

  createProject(project: ProjectInput) {
    return http.POST<{ project: Project }>('/api/projects', project);
  }

  updateProject(project: ProjectInput) {
    return http.PUT<{ project: Project }>(`/api/projects/${project.id}`, project);
  }

  addOrUpdateReusableLineItem(projectId: string, lineItem: ReusableLineItem) {
    return http.POST(`/api/projects/${projectId}/reusable-items`, lineItem);
  }

  addSingleUseLineItem(projectId: string, lineItem: SingleUseLineItem) {
    return http.POST(`/api/projects/${projectId}/single-use-items`, lineItem);
  }

  deleteSingleUseItem(projectId: string, lineItemId: string) {
    return http.DELETE(`/api/projects/${projectId}/single-use-items`, { id: lineItemId });
  }

  getProjectInventory(projectId: string) {
    return http.GET<ProjectInventory>(`/api/projects/${projectId}/inventory`);
  }

  deleteProjectInventory(projectId: string) {
    return http.DELETE(`/api/projects/${projectId}/inventory/delete`);
  }

  updateProjectInventory(projectId: string, inventory: InventoryInput) {
    return http.POST(`/api/projects/${projectId}/inventory/upload`, inventory);
  }
  sendMailchimpEvent(name: MailChimpEvent) {
    return http.POST('/api/events', { name });
  }
}

export default new Client();

import type { Project } from '@prisma/client';

import type { AllProjectsSummary } from 'lib/calculator/getProjections';
import type { InventoryInput } from 'lib/inventory/saveInventoryRecords';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import type { ReusableLineItem, SingleUseLineItem } from 'lib/inventory/types/projects';
import type { MailChimpEvent } from 'lib/mailchimp/sendEvent';

import * as http from './http';

export type AccountSetupFields = {
  name: string;
  email: string;
  USState: string;
};

export type ProjectInput = {
  id?: string;
  name: string;
  metadata: any;
  accountId: string;
  orgId: string;
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
  createOrganization(org: { name: string }) {
    return http.POST('/api/org', org);
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

  updateProfile(profile: { id: string; name: string }) {
    return http.PUT('/api/profile/' + profile.id, profile);
  }

  createProject(project: ProjectInput) {
    return http.POST<{ project: Project }>('/api/projects', project);
  }

  updateProject(project: ProjectInput) {
    return http.PUT<{ project: Project }>(`/api/projects/${project.id}`, project);
  }

  addReusableLineItem(projectId: string, lineItem: ReusableLineItem) {
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

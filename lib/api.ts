import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import type { SubscriptionResponse } from 'lib/stripe/getCustomerSubscription';
import type { SubscriptionProduct } from 'lib/stripe/getSubscriptionProduct';
import type { TrialRequestBody } from 'pages/api/stripe/create-subscription';

import * as http from './http';
import { ProjectTag } from '@prisma/client';

function _useGET<T = unknown>(path: string | undefined | null, query: any = {}) {
  const requestUrl = path ? path + _getQueryString(query) : null;
  return useSWR<T>(requestUrl, http.GET);
}

function _usePOST<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, _makePOST);
}

function _usePUT<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, _makePUT);
}

function _useDELETE<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, _makeDELETE);
}

function _makePOST(url: string, { arg }: { arg: any }) {
  return http.POST(url, arg);
}
function _makePUT(url: string, { arg }: { arg: any }) {
  return http.PUT(url, arg);
}
function _makeDELETE(url: string, { arg }: { arg: any }) {
  return http.DELETE(url, arg);
}

function _getQueryString(query: any = {}) {
  // map optional query inputs into the url
  const queryStr = Object.keys(query)
    .filter(key => !!query[key])
    .map(key => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
  return queryStr ? `?${queryStr}` : '';
}

// API Hooks

export function useCreateTrial() {
  return _usePOST<TrialRequestBody>('/api/stripe/create-subscription');
}

export function useUpdateBillingEmail() {
  return _usePUT<{ email: string }>('/api/stripe/customer');
}

export function useGetSubscriptionProduct() {
  return _useGET<SubscriptionProduct>('/api/stripe/get-product');
}

export function useGetSubscription() {
  return _useGET<SubscriptionResponse>('/api/stripe/subscription');
}

export function useUpdateSubscription() {
  return _usePUT<{ stripePrice: string }>('/api/stripe/subscription');
}

export function useCancelSubscription() {
  return _useDELETE('/api/stripe/subscription');
}

export function useCreatePaymentMethod() {
  return _usePOST<{ customerId: string; paymentMethodId: string }>('/api/stripe/payment-method');
}

export const members = {
  useDeleteMember() {
    return useSWRMutation<unknown, Error, string, { isInvite: boolean; key: string }>(
      '/api/user/delete',
      (key, { arg: member }) => {
        const resource = member.isInvite ? 'invite' : 'profile';
        return http.DELETE(`/api/${resource}/${member.key}`);
      }
    );
  }
};

export const projects = {};

export function useGetTags(orgId: string | undefined | null) {
  return _useGET<ProjectTag[]>('/api/tags', { orgId });
}

export function useCreateTag(orgId: string) {
  return useSWRMutation<unknown, Error, string, { label: string }>(`/api/tags?orgId=${orgId}`, (url, { arg }) =>
    http.POST(url, arg)
  );
}

export function useDeleteTag(orgId: string) {
  return useSWRMutation<unknown, Error, string, { tagId: string }>(`/api/tags?orgId=${orgId}`, (url, { arg }) =>
    http.DELETE(url, arg)
  );
}

// Legacy functions for backward compatibility
export const fetchTags = async (orgId: string): Promise<ProjectTag[]> => {
  const response = await fetch(`/api/tags?orgId=${orgId}`);
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
};

export const addTag = async (orgId: string, label: string): Promise<ProjectTag> => {
  const response = await fetch(`/api/tags?orgId=${orgId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  });
  if (!response.ok) throw new Error('Failed to create tag');
  return response.json();
};

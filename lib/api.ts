import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import type { SubscriptionResponse } from 'lib/stripe/getCustomerSubscription';
import type { SubscriptionProduct } from 'lib/stripe/getSubscriptionProduct';
import type { TrialRequestBody } from 'pages/api/stripe/create-subscription';

import * as http from './http';

function _useGET<T = unknown>(path: string, query: any = {}) {
  // map optional query inputs into the url
  const queryStr = Object.keys(query)
    .filter(key => !!query[key])
    .map(key => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
  const requestUrl = path + (queryStr ? '?' + queryStr : '');
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
  return _useDELETE<SubscriptionResponse>('/api/stripe/subscription');
}

export function useCreatePaymentMethod() {
  return _usePOST<{ customerId: string; paymentMethodId: string }>('/api/stripe/payment-method');
}

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import * as http from 'lib/http';

export function useGET<T = unknown>(path: string | undefined | null, query: any = {}) {
  const requestUrl = path ? path + _getQueryString(query) : null;
  return useSWR<T>(requestUrl, http.GET);
}

export function usePOST<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, makePOST);
}

export function usePUT<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, makePUT);
}

export function useDELETE<T>(path: string) {
  return useSWRMutation<unknown, Error, string, T>(path, makeDELETE);
}

export function makePOST(url: string, { arg }: { arg: any }) {
  return http.POST(url, arg);
}

export function makePUT(url: string, { arg }: { arg: any }) {
  return http.PUT(url, arg);
}

export function makeDELETE(url: string, { arg }: { arg: any }) {
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

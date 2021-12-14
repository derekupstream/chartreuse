import { useMutation, useQuery } from 'react-query'

export const useSimpleQuery = <T = any>(url: string) => {
  const query = () => fetch(url).then(res => res.json())
  return useQuery<T>(url, query)
}

export const useSimpleMutation = (url: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
  const mutate = (data: any) =>
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(res => res.json())
  return useMutation(url, mutate)
}

import { useMutation, useQuery } from 'react-query'

export const useSimpleQuery = <T = any>(url: string) => {
  const query = () =>
    fetch(url).then(res => {
      if (res.ok) {
        // if json fails, assume the response is just empty
        return res.json().catch(err => null)
      }
      return res.json()
    })
  return useQuery<T>(url, query, {
    refetchOnWindowFocus: false,
  })
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

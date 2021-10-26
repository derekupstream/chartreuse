import { useMutation, useQuery } from 'react-query'

export const useSimpleQuery = (url: string) => {
  const query = () => fetch(url).then(res => res.json())
  return useQuery(url, query)
}

export const useSimpleMutation = (url: string) => {
  const mutate = (data: any) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(res => res.json())
  return useMutation(url, mutate)
}

export default useSimpleQuery

import { useQuery } from 'react-query'

const useSimpleQuery = (url: string) => {
  return useQuery(url, () => fetch(url).then(res => res.json()))
}

export default useSimpleQuery

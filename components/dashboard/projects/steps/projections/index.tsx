import { Wrapper } from '../styles'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import Summary from './summary'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { ProjectionsResponse } from 'internal-api/calculator'
import ContentLoader from 'components/content-loader'

const Projections = ({ projectId }: { projectId: string }) => {
  const url = `/api/projections/?projectId=${projectId}`
  const { data, isLoading } = useSimpleQuery<ProjectionsResponse>(url)

  if (!data || isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Summary projections={data} />
      <FinancialSummary projections={data} />
      <EnvironmentalSummary projections={data} />
    </Wrapper>
  )
}

export default Projections

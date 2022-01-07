import { Wrapper } from '../styles'
import { Typography } from 'antd'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { ProjectionsResponse } from 'lib/calculator'
import ContentLoader from 'components/content-loader'
import ProjectImpacts from './project-impacts/project-impacts'
import { useFooterState } from '../footer'
import { useEffect } from 'react'

const Projections = ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => {
  const url = `/api/projections/?projectId=${projectId}`
  const { data, isLoading } = useSimpleQuery<ProjectionsResponse>(url)

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true })
    console.log('set state')
  }, [setFooterState])

  if (!data || isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Typography.Title level={2}>{projectTitle} Savings projections</Typography.Title>
      <ProjectImpacts data={data.annualSummary} />
      <FinancialSummary data={data.financialResults} />
      <EnvironmentalSummary data={data.environmentalResults} />
    </Wrapper>
  )
}

export default Projections

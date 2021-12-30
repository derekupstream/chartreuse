import { Wrapper } from '../styles'
import { Typography } from 'antd'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { ProjectionsResponse } from 'internal-api/calculator'
import ContentLoader from 'components/content-loader'
import ProjectImpacts from './project-impacts/project-impacts'
import FooterNavigator from 'components/footer-navigator'

const Projections = ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => {
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
      <Typography.Title level={2}>{projectTitle} Savings projections</Typography.Title>
      <ProjectImpacts data={data.annualSummary} />
      <FinancialSummary data={data.financialResults} />
      <EnvironmentalSummary data={data.environmentalResults} />
      <FooterNavigator previousStepLinkSuffix="/additional-costs" previousStepTitle="Additional costs" />
    </Wrapper>
  )
}

export default Projections

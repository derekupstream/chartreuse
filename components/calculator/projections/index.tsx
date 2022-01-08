import { Wrapper } from '../styles'
import { Col, Row, Menu, Typography } from 'antd'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { ProjectionsResponse } from 'lib/calculator'
import ContentLoader from 'components/content-loader'
import ProjectImpacts from './project-impacts/project-impacts'
import { useFooterState } from '../footer'
import { useEffect, useState } from 'react'
import SingleUseDetails from './single-use-details/single-use-details'

const Projections = ({ projectId, projectTitle }: { projectId: string; projectTitle: string }) => {
  const url = `/api/projections/?projectId=${projectId}`
  const { data, isLoading } = useSimpleQuery<ProjectionsResponse>(url)
  const [showSingleUse, setShowSingleUse] = useState(false)

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true })
  }, [setFooterState])

  function onSelect(e: { key: string }) {
    setShowSingleUse(e.key === '2' ? true : false)
  }

  if (!data || isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <Typography.Title level={1}>{projectTitle} Savings projections</Typography.Title>
      <Row gutter={24}>
        <Col span={5}>
          <Menu style={{ width: '100%' }} selectedKeys={[showSingleUse ? '2' : '1']} onSelect={onSelect} mode={'vertical'}>
            <Menu.Item key="1">Summary</Menu.Item>
            <Menu.Item key="2">Single-use details</Menu.Item>
          </Menu>
        </Col>
        <Col span={19}>
          {showSingleUse && <SingleUseDetails data={data} />}
          {!showSingleUse && (
            <>
              <ProjectImpacts data={data.annualSummary} />
              <FinancialSummary data={data.financialResults} />
              <EnvironmentalSummary data={data.environmentalResults} />
            </>
          )}
        </Col>
      </Row>
    </Wrapper>
  )
}

export default Projections

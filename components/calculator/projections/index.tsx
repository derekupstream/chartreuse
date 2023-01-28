import { Wrapper } from '../styles'
import { Button, Col, Row, Menu, Typography } from 'antd'
import FinancialSummary from './financial/summary'
import EnvironmentalSummary from './environmental/summary'
import { useSimpleQuery } from 'hooks/useSimpleQuery'
import { ProjectionsResponse } from 'lib/calculator/getProjections'
import ContentLoader from 'components/content-loader'
import { PrinterOutlined } from '@ant-design/icons'
import ProjectImpacts from './project-impacts/project-impacts'
import { useFooterState } from '../footer'
import { useEffect, useRef, useState } from 'react'
import type { ProjectContext } from 'lib/middleware/getProjectContext'
import { PrintHeader } from 'components/print/print-header'
import SingleUseDetails from './single-use-details/single-use-details'
import { useReactToPrint } from 'react-to-print'
import styled from 'styled-components'

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`
const Projections = ({ project }: { project: ProjectContext['project'] }) => {
  const url = `/api/projects/${project.id}/projections`
  const { data, isLoading } = useSimpleQuery<ProjectionsResponse>(url)
  const [showSingleUse, setShowSingleUse] = useState(false)

  const { setFooterState } = useFooterState()
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true })
  }, [setFooterState])

  function onSelect(e: { key: string }) {
    setShowSingleUse(e.key === '2' ? true : false)
  }

  // for printing
  const componentRef = useRef(null)
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${project.name} Savings projections - Chart Reuse`,
  })

  if (!data || isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    )
  }

  return (
    <Wrapper ref={componentRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Savings projections</Typography.Title>
        <Button className="dont-print-me" onClick={handlePrint}>
          <PrinterOutlined /> Print
        </Button>
      </div>
      <Row gutter={24}>
        <Col span={5} className="dont-print-me">
          <Menu
            style={{ width: '100%' }}
            selectedKeys={[showSingleUse ? '2' : '1']}
            onSelect={onSelect}
            mode={'vertical'}
            items={[
              { key: '1', label: 'Summary' },
              { key: '2', label: 'Single-use details' },
            ]}
          />
        </Col>
        <StyledCol span={19}>
          <span className={!showSingleUse ? '' : 'print-only'}>
            <ProjectImpacts data={data.annualSummary} />
            <div className="page-break" />
            <FinancialSummary data={data.financialResults} />
            <div className="page-break" />
            <EnvironmentalSummary data={data.environmentalResults} />
          </span>
          <div className="page-break" />
          <span className={showSingleUse ? '' : 'print-only'}>
            <SingleUseDetails data={data} />
          </span>
        </StyledCol>
      </Row>
    </Wrapper>
  )
}

export default Projections

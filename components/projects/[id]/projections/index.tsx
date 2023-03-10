import { Col, Row, Menu, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/content-loader';
import { PrintButton } from 'components/print/print-button';
import { PrintHeader } from 'components/print/print-header';
import { useSimpleQuery } from 'hooks/useSimpleQuery';
import type { ProjectionsResponse } from 'lib/calculator/getProjections';
import type { ProjectContext } from 'lib/middleware/getProjectContext';

import { useFooterState } from '../components/footer';
import { Wrapper } from '../styles';

import EnvironmentalSummary from './environmental/summary';
import FinancialSummary from './financial/summary';
import ProjectImpacts from './project-impacts/project-impacts';
import SingleUseDetails from './single-use-details/single-use-details';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;
const Projections = ({ project }: { project: ProjectContext['project'] }) => {
  const url = `/api/projects/${project.id}/projections`;
  const { data, isLoading } = useSimpleQuery<ProjectionsResponse>(url);
  const [showSingleUse, setShowSingleUse] = useState(false);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  function onSelect(e: { key: string }) {
    setShowSingleUse(e.key === '2' ? true : false);
  }

  // for printing
  const printRef = useRef(null);

  if (!data || isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={printRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Savings projections</Typography.Title>
        <PrintButton printRef={printRef} pdfTitle={`${project.name} Savings Projections - Chart Reuse`} />
      </div>
      <Typography.Title level={5}>
        These graphs - showing the financial and environmental impacts of reducing single-use items - can help you make the case for reuse and make data driven decisions on how to move forward. You
        can also print a PDF for sharing and distribution. (calculated by{' '}
        <a href='https://www.epa.gov/warm/basic-information-about-waste-reduction-model-warm' target='_blank' rel='noreferrer'>
          EPA WARM
        </a>{' '}
        model)
        <br />
        <br />
      </Typography.Title>
      <Row gutter={24}>
        <Col span={5} className='dont-print-me'>
          <Menu
            style={{ width: '100%' }}
            selectedKeys={[showSingleUse ? '2' : '1']}
            onSelect={onSelect}
            mode={'vertical'}
            items={[
              { key: '1', label: 'Summary' },
              { key: '2', label: 'Single-use details' }
            ]}
          />
        </Col>
        <StyledCol span={19}>
          <span className={!showSingleUse ? '' : 'print-only'}>
            <ProjectImpacts data={data.annualSummary} />
            <div className='page-break' />
            <FinancialSummary data={data.financialResults} />
            <div className='page-break' />
            <EnvironmentalSummary data={data.environmentalResults} />
          </span>
          <div className='page-break' />
          <span className={showSingleUse ? '' : 'print-only'}>
            <SingleUseDetails data={data} />
          </span>
        </StyledCol>
      </Row>
    </Wrapper>
  );
};

export default Projections;

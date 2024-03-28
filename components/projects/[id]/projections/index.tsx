import { Col, Row, Menu, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { ErrorPage } from 'components/common/errors/ErrorPage';
import { PrintButton } from 'components/common/print/PrintButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { projects } from 'lib/api';
import type { ProjectContext } from 'lib/middleware/getProjectContext';

import { useFooterState } from '../components/Footer';
import { Wrapper } from '../styles';

import EnvironmentalSummary from './environmental/Summary';
import FinancialSummary from './financial/Summary';
import { LineItemDetails } from './LineItemDetails/LineItemDetails';
import ProjectImpacts from './ProjectImpacts/ProjectImpacts';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;

export type ProjectionsView = 'summary' | 'single_use_details' | 'reusable_details';

const Projections = ({ project }: { project: ProjectContext['project'] }) => {
  const [view, setView] = useState<ProjectionsView>('summary');
  const { data, error, isLoading } = projects.useGetProjections(project.id);

  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  function onSelect(e: { key: string }) {
    setView(e.key as ProjectionsView);
  }

  // for printing
  const printRef = useRef(null);

  if (isLoading) {
    return (
      <Wrapper>
        <ContentLoader />
      </Wrapper>
    );
  }

  if (error || !data) {
    return (
      <Wrapper>
        <ErrorPage />
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={printRef}>
      <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={1}>Savings projections</Typography.Title>
        <PrintButton printRef={printRef} pdfTitle={`${project.name} Savings Projections - Chart-Reuse`} />
      </div>
      <Typography.Title level={5}>
        These graphs - showing the financial and environmental impacts of reducing single-use items - can help you make
        the case for reuse and make data driven decisions on how to move forward. You can also print a PDF for sharing
        and distribution.
        <br />
        <br />
      </Typography.Title>
      <Row gutter={24}>
        <Col span={5} className='dont-print-me'>
          <Menu
            style={{ width: '100%' }}
            selectedKeys={[view]}
            onSelect={onSelect}
            mode={'vertical'}
            items={[
              { key: 'summary', label: 'Summary' },
              { key: 'single_use_details', label: 'Single-use details' },
              { key: 'reusable_details', label: 'Reusable details' }
            ]}
          />
        </Col>
        <StyledCol span={19}>
          <span className={view === 'summary' ? '' : 'print-only'}>
            <ProjectImpacts data={data.annualSummary} />
            <div className='page-break' />
            <FinancialSummary data={data.financialResults} />
            <div className='page-break' />
            <EnvironmentalSummary data={data.environmentalResults} />
          </span>
          <div className='page-break' />
          <span className={view === 'single_use_details' ? '' : 'print-only'}>
            <LineItemDetails showTitle variant='single_use' lineItemSummary={data.singleUseResults} />
          </span>
          <span className={view === 'reusable_details' ? '' : 'print-only'}>
            <LineItemDetails showTitle variant='reusable' lineItemSummary={data.reusableResults} />
          </span>
        </StyledCol>
      </Row>
    </Wrapper>
  );
};

export default Projections;

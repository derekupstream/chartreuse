import { Card, Col, Row, Menu, Slider, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import type { ProjectProjection } from 'lib/share/getSharedProjections';

import { useFooterState } from '../projects/[id]/components/Footer';
import type { ProjectionsView } from '../projects/[id]/projections';
import EnvironmentalSummary from '../projects/[id]/projections/environmental/Summary';
import FinancialSummary from '../projects/[id]/projections/financial/Summary';
import { LineItemDetails } from '../projects/[id]/projections/LineItemDetails/LineItemDetails';
import ProjectImpacts from '../projects/[id]/projections/ProjectImpacts/ProjectImpacts';
import { ResponsiveWrapper } from '../projects/[id]/styles';

import { ContentHeader } from './components/ContentHeader';
import { PageBanner } from './components/PageBanner';
import { PageFooter } from './components/PageFooter';
import { SignupCard } from './components/SignupCard';

type SharedPageView = ProjectionsView;

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;

const DesktopElement = styled.div`
  display: none;
  @media (min-width: 900px) {
    display: block;
  }
`;

const MobileElement = styled.div`
  display: block;
  @media (min-width: 900px) {
    display: none;
  }
`;

const mainSectionHeaderHeight = 60;

const StyledLeftCol = styled(Col)`
  @media (min-width: 900px) {
    padding-top: ${mainSectionHeaderHeight}px;
  }
`;

export function SharedPage({
  projections,
  pageTitle
}: {
  orgName: string;
  projections: ProjectProjection[];
  pageTitle: string;
}) {
  const [view, setView] = useState<SharedPageView>('summary');
  const [data, setData] = useState(projections[0]);
  const router = useRouter();

  const defaultBusiness = router.query.project && projections.find(project => project.slug === router.query.project);
  const businessSize = defaultBusiness ? projections.indexOf(defaultBusiness) : 0;
  console.log({ businessSize });
  // for printing
  const printRef = useRef(null);

  const { setFooterState } = useFooterState();

  function onSelect(e: { key: string }) {
    setView(e.key as ProjectionsView);
  }

  function setBusinessSize(value: number) {
    const nextProjection = projections[value];
    if (nextProjection) {
      router.push({ query: { ...router.query, project: nextProjection.slug } }, undefined, { shallow: true });
    }
  }

  function openAssumptionsPopup() {
    const url = router.asPath.split('?')[0];
    window.open(url + '/assumptions', '_blank', 'popup,width=800,height=600');
  }

  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  useEffect(() => {
    const data = router.query.project && projections.find(p => p.slug === router.query.project);
    if (data) {
      setData(data);
    }
  }, [router.query.project, projections]);

  return (
    <>
      <PageBanner />
      <ResponsiveWrapper ref={printRef} style={{ marginTop: 0 }}>
        <MobileElement>
          <ContentHeader onClickAssumptions={openAssumptionsPopup} printRef={printRef} pageTitle={pageTitle} />
        </MobileElement>
        <Row gutter={24}>
          <StyledLeftCol xs={24} md={8} lg={5} className='dont-print-me'>
            <Menu
              style={{ width: '100%', marginBottom: 24 }}
              selectedKeys={[view]}
              onSelect={onSelect}
              mode={'vertical'}
              items={[
                { key: 'summary', label: 'Overview' },
                { key: 'single_use_details', label: 'Single-use details' },
                { key: 'reusable_details', label: 'Reusable details' }
              ]}
            />
            <Card>
              <Typography.Paragraph>Avg. Customers / day</Typography.Paragraph>
              <div style={{ padding: '0 14px' }}>
                <Slider
                  marks={{
                    0: '150',
                    1: '400',
                    2: '600'
                  }}
                  defaultValue={businessSize}
                  min={0}
                  max={2}
                  onChange={setBusinessSize}
                  step={1}
                  tooltip={{
                    open: false
                  }}
                />
              </div>
            </Card>
          </StyledLeftCol>
          <StyledCol xs={24} md={16} lg={19}>
            <DesktopElement>
              <ContentHeader onClickAssumptions={openAssumptionsPopup} printRef={printRef} pageTitle={pageTitle} />
            </DesktopElement>
            <span className={view === 'summary' ? '' : 'print-only'}>
              <ProjectImpacts data={data.projections.annualSummary} />
              <div className='page-break' />
              <FinancialSummary data={data.projections.financialResults} businessSize={businessSize} />
              <div className='page-break' />
              <EnvironmentalSummary data={data.projections.environmentalResults} />
            </span>
            <div className='page-break' />
            <span className={view === 'single_use_details' ? '' : 'print-only'}>
              <LineItemDetails variant='single_use' lineItemSummary={data.projections.singleUseResults} />
            </span>
            <span className={view === 'reusable_details' ? '' : 'print-only'}>
              <LineItemDetails variant='reusable' lineItemSummary={data.projections.reusableResults} />
            </span>
            {/* <span className={view === 'assumptions' ? '' : 'print-only'}>
              <ProjectionAssumptions />
            </span> */}
            <SignupCard templateParams={data.templateParams} />
          </StyledCol>
        </Row>
      </ResponsiveWrapper>
      <PageFooter />
    </>
  );
}

import { Col, Row, Menu, Slider, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import type { ProjectProjection } from 'lib/share/getSharedProjections';

import { useFooterState } from 'components/projects/[id]/components/Footer';
import { EventProjectSummary } from 'components/projects/[id]/projections/components/EventProjectSummary';
import type { ProjectionsView } from 'components/projects/[id]/projections/ProjectionsStep';
import { ProjectSummary } from 'components/projects/[id]/projections/components/ProjectSummary/ProjectSummary';
import { LineItemSummary } from 'components/projects/[id]/projections/components/LineItemSummary/LineItemSummary';
import Card from 'components/projects/[id]/projections/components/common/Card';
import { ResponsiveWrapper } from 'components/projects/[id]/styles';

import { ContentHeader } from './components/ContentHeader';
import { PageBanner } from './components/PageBanner';
import { PageFooter } from './components/PageFooter';
import { SignupCard } from './components/SignupCard';
import { SlateEditor } from 'components/common/SlateEditor';
import { SectionContainer } from 'components/projects/[id]/projections/components/common/styles';
import { isEugeneOrg } from 'lib/featureFlags';

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
  dashboardTitle,
  orgId,
  projections,
  pageTitle,
  isProjectTemplate,
  bannerTitle,
  bannerDescription,
  useShrinkageRate
}: {
  dashboardTitle: string;
  orgId?: string;
  orgName: string;
  projections: ProjectProjection[];
  pageTitle: string;
  isProjectTemplate?: boolean;
  bannerTitle?: string | null;
  bannerDescription?: string | null;
  useShrinkageRate: boolean;
}) {
  const [view, setView] = useState<SharedPageView>('summary');
  const [data, setData] = useState(projections[0]);
  const router = useRouter();

  const defaultBusiness = router.query.project && projections.find(project => project.slug === router.query.project);
  const businessSize = defaultBusiness ? projections.indexOf(defaultBusiness) : 0;

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

  const hasRecommendations = Boolean(
    data.showRecommendations &&
      // check if recommendations content has more than one line, or the first line at least has text
      (data.recommendations?.length > 1 ||
        (data.recommendations &&
          data.recommendations[0].children.length &&
          data.recommendations[0].children[0].text.length))
  );

  const hideSingleAndReusableDetailsForEugeneOrg = isEugeneOrg({ id: orgId ?? '' });

  const sidebarMenuItems = hideSingleAndReusableDetailsForEugeneOrg
    ? [{ key: 'summary', label: 'Overview' }]
    : [
        { key: 'summary', label: 'Overview' },
        { key: 'single_use_details', label: 'Single-use details' },
        { key: 'reusable_details', label: 'Reusable details' }
      ];
  return (
    <>
      <PageBanner dashboardTitle={dashboardTitle} title={bannerTitle} description={bannerDescription} />
      <ResponsiveWrapper ref={printRef} style={{ marginTop: 0 }}>
        <MobileElement>
          <ContentHeader
            showAssumptions={isProjectTemplate}
            onClickAssumptions={openAssumptionsPopup}
            printRef={printRef}
            pageTitle={pageTitle}
          />
        </MobileElement>
        <Row gutter={24}>
          <StyledLeftCol xs={24} md={8} lg={5} className='dont-print-me'>
            <Menu
              style={{ width: '100%', marginBottom: 24 }}
              selectedKeys={[view]}
              onSelect={onSelect}
              mode={'vertical'}
              items={sidebarMenuItems}
            />
            {hasRecommendations && (
              <Menu
                style={{ width: '100%', marginBottom: 24 }}
                selectedKeys={[view]}
                onSelect={onSelect}
                mode={'vertical'}
                items={[{ key: 'recommendations', label: 'Recommendations' }]}
              />
            )}
            {isProjectTemplate && (
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
            )}
          </StyledLeftCol>
          <StyledCol xs={24} md={16} lg={19}>
            <DesktopElement>
              <ContentHeader
                showAssumptions={isProjectTemplate}
                onClickAssumptions={openAssumptionsPopup}
                printRef={printRef}
                pageTitle={pageTitle}
              />
            </DesktopElement>
            <span className={view === 'summary' ? '' : 'print-only'}>
              {data.projectCategory === 'event' ? (
                <EventProjectSummary data={data.projections} useShrinkageRate={useShrinkageRate} />
              ) : (
                <ProjectSummary data={data.projections} businessSize={businessSize} />
              )}
            </span>
            {!hideSingleAndReusableDetailsForEugeneOrg && (
              <>
                <div className='page-break' />
                <span className={view === 'single_use_details' ? '' : 'print-only'}>
                  <LineItemSummary variant='single_use' lineItemSummary={data.projections.singleUseResults} />
                </span>
                <span className={view === 'reusable_details' ? '' : 'print-only'}>
                  <LineItemSummary
                    variant='reusable'
                    lineItemSummary={data.projections.reusableResults}
                    isOnSiteDiningProjectReusables
                  />
                </span>
              </>
            )}
            {hasRecommendations && view === 'recommendations' && (
              <SectionContainer>
                <Card>
                  <SlateEditor readOnly value={data.recommendations} />
                </Card>
              </SectionContainer>
            )}
            {/* <span className={view === 'assumptions' ? '' : 'print-only'}>
              <ProjectionAssumptions />
            </span> */}
            {isProjectTemplate && <SignupCard templateParams={data.templateParams} />}
          </StyledCol>
        </Row>
      </ResponsiveWrapper>
      <PageFooter />
    </>
  );
}

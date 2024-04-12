import { EditOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Card, Col, Row, Menu, Slider, Typography } from 'antd';
import { Button } from 'antd';
import Image from 'next/legacy/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { PrintButton } from 'components/common/print/PrintButton';
import { Container as FooterContainer } from 'components/projects/[id]/components/Footer/styles';
import { setSelectedTemplateCookie } from 'lib/cookies';
import type { ProjectProjection } from 'lib/share/getSharedProjections';
import Stadium from 'public/images/stadium.svg';
import pageBannerBackgroundSrc from 'public/images/template_banner_green_bg.png';

import { useFooterState } from '../projects/[id]/components/Footer';
import type { ProjectionsView } from '../projects/[id]/projections';
import EnvironmentalSummary from '../projects/[id]/projections/environmental/Summary';
import FinancialSummary from '../projects/[id]/projections/financial/Summary';
import { LineItemDetails } from '../projects/[id]/projections/LineItemDetails/LineItemDetails';
import ProjectImpacts from '../projects/[id]/projections/ProjectImpacts/ProjectImpacts';
import { ResponsiveWrapper } from '../projects/[id]/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
`;

const StyledCard = styled(Card)`
  // box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
  // border-radius: 8px;
  .ant-card-body {
    height: 100%;
  }
`;

const GreenStyledCard = styled(Card)`
  background-color: #2bbe50;
  color: white;
`;

const BannerCard = styled(GreenStyledCard)`
  background-color: #cefaa5;
  border-radius: 16px;
  height: 310px;
  margin-bottom: 24px;
  overflow: hidden;
  .ant-card-body {
    padding: 0;
  }
  .ant-row {
    flex-flow: row; // this prevents extra height when the left column appears
  }
  .ant-card-body,
  .ant-row {
    height: 100%;
  }
`;

const LeftCol = styled(Col)`
  display: none;
  @media (min-width: 900px) {
    display: block;
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
  const [view, setView] = useState<ProjectionsView>('summary');
  const [data, setData] = useState(projections[0]);
  const [absoluteUrl, setAbsoluteUrl] = useState('');
  const router = useRouter();

  const defaultBusiness = router.query.project && projections.find(project => project.slug === router.query.project);
  const defaultBusinessSize = defaultBusiness ? projections.indexOf(defaultBusiness) : 0;

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

  function selectTemplate() {
    setSelectedTemplateCookie(data.templateParams);
    router.push('/signup');
  }

  useEffect(() => {
    setFooterState({ path: '/projections', stepCompleted: true });
  }, [setFooterState]);

  // capture window URL
  useEffect(() => {
    setAbsoluteUrl(window.location.href);
  }, [setAbsoluteUrl]);

  useEffect(() => {
    const data = router.query.project && projections.find(p => p.slug === router.query.project);
    if (data) {
      setData(data);
    }
  }, [router.query.project]);

  return (
    <>
      <ResponsiveWrapper ref={printRef}>
        {/* <PrintHeader accountName={project.account.name} orgName={project.org.name} projectName={project.name} /> */}
        <BannerCard>
          <Row>
            <LeftCol flex='0 310px 1'>
              <Image src={pageBannerBackgroundSrc} alt='' height={310} />
            </LeftCol>
            <Col
              flex='1 auto'
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}
            >
              <div>
                <Typography.Title level={2} style={{ color: '#343f29' }}>
                  Your switch to reusables!
                </Typography.Title>
                <Typography.Title level={5} style={{ color: '#343f29' }}>
                  <ul>
                    <li>
                      <u>Save money</u> by purchasing durable reusable dishware
                    </li>
                    <li>
                      Meet environmental goals by <u>reducing GHG emissions</u>
                    </li>
                    <li>Reduce your business&apos;s contribution to landfill waste</li>
                    <li>Improve quality of dining experience!</li>
                  </ul>
                </Typography.Title>
              </div>
            </Col>
          </Row>
        </BannerCard>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Typography.Text
            copyable={{
              icon: [
                <Button key={0} className='dont-print-me'>
                  <ShareAltOutlined /> Share
                </Button>,
                <Button key={1} className='dont-print-me'>
                  <ShareAltOutlined /> Copied
                </Button>
              ],
              text: absoluteUrl
            }}
          ></Typography.Text>
          <PrintButton printRef={printRef} pdfTitle={pageTitle} />
        </div>
        <br />
        <Row gutter={24}>
          <Col xs={24} md={8} lg={5} className='dont-print-me'>
            <Menu
              style={{ width: '100%', marginBottom: 24 }}
              selectedKeys={[view]}
              onSelect={onSelect}
              mode={'vertical'}
              items={[
                { key: 'summary', label: 'Summary' },
                { key: 'single_use_details', label: 'Single-use details' },
                { key: 'reusable_details', label: 'Reusable details' }
              ]}
            />
            <StyledCard>
              <Typography.Paragraph>Size of Business</Typography.Paragraph>
              <div style={{ padding: '0 14px' }}>
                <Slider
                  marks={{
                    0: 'Small',
                    1: 'Mid',
                    2: 'Large'
                  }}
                  defaultValue={defaultBusinessSize}
                  min={0}
                  max={2}
                  onChange={setBusinessSize}
                  step={1}
                  tooltip={{
                    open: false
                  }}
                />
              </div>
            </StyledCard>
            <StyledCard style={{ marginBottom: 24 }}>
              <Description>
                <strong>Small:</strong> 150 customers /day
              </Description>
              <Description>
                <strong>Mid:</strong> 400 customers /day
              </Description>
              <Description>
                <strong>Large:</strong> 600+ customers /day
              </Description>
            </StyledCard>
            <GreenStyledCard onClick={selectTemplate}>
              <Button
                ghost
                icon={<EditOutlined />}
                size='large'
                style={{
                  borderColor: 'white !important',
                  color: 'white !important',
                  cursor: 'pointer',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              >
                Edit Template
              </Button>
              <br />
              <br />
              <Typography.Paragraph style={{ color: 'white' }}>
                This is a template, chart your own switch to reuse by creating a free account,{' '}
                <Typography
                  style={{
                    display: 'inline',
                    cursor: 'pointer',
                    color: 'white',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  sign up now
                </Typography>
              </Typography.Paragraph>
            </GreenStyledCard>
          </Col>
          <StyledCol xs={24} md={16} lg={19}>
            <span className={view === 'summary' ? '' : 'print-only'}>
              <ProjectImpacts data={data.projections.annualSummary} />
              <div className='page-break' />
              <FinancialSummary data={data.projections.financialResults} />
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
          </StyledCol>
        </Row>
      </ResponsiveWrapper>
      <FooterContainer style={{ justifyContent: 'center' }}>
        <em>
          Powered by Chart-Reuse, the world&apos;s only analytics tool for switching to reuse.{' '}
          <Link style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }} href='/signup'>
            Create a free account
          </Link>{' '}
          and get started
        </em>
      </FooterContainer>
    </>
  );
}

function Description({ children }: { children: React.ReactNode }) {
  return <Typography.Paragraph style={{ fontSize: 12 }}>{children}</Typography.Paragraph>;
}

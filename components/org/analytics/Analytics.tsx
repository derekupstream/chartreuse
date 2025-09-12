import { DownloadOutlined } from '@ant-design/icons';
import type { Org, ProjectCategory, User } from '@prisma/client';
import type { SelectProps } from 'antd';
import { Button, Col, Form, Row, Select, Table, Typography, Divider, Tabs } from 'antd';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { PrintButton } from 'components/common/print/PrintButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { Spacer } from 'components/common/Spacer';
import Card from 'components/projects/[id]/projections/components/common/Card';
import * as S from 'components/projects/[id]/projections/components/common/styles';
import type { AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInPounds, formattedValueInPounds } from 'lib/number';
import { SummaryCardWithGraph } from './components/SummaryCardWithGraph';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { columns } from './components/AnalyticsTableColumns';

import * as S2 from '../../../layouts/styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;

export interface PageProps {
  isUpstreamView?: boolean;
  showCategoryTabs?: boolean;
  projectCategory: ProjectCategory;
  user: User & { org: Org };
  data?: AllProjectsSummary;
  allAccounts?: { id: string; name: string }[];
  allProjects?: { id: string; accountId: string; name: string }[];
}

export function AnalyticsPage({
  user,
  data,
  allAccounts,
  allProjects,
  projectCategory,
  isUpstreamView,
  showCategoryTabs
}: PageProps) {
  const router = useRouter();
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  // for printing
  const printRef = useRef(null);

  if (!data) {
    return <ContentLoader />;
  }

  const selectedProjects = typeof router.query.projects === 'string' ? router.query.projects.split(',') : [];

  const options: SelectProps['options'] = [
    {
      label: 'Filter by Account',
      options: allAccounts?.map(account => ({
        label: account.name,
        value: account.id
      }))
    },
    {
      label: 'Filter by Project',
      options: allProjects?.map(project => ({
        label: project.name,
        value: project.id
      }))
    }
  ];

  function handleChange(value: string[]) {
    const accountIds = value.filter(id => allAccounts?.some(project => project.id === id));
    const projectIds = value.filter(id => allProjects?.some(project => project.id === id));
    let updatedPath = router.asPath.split('?')[0];
    if (accountIds.length) {
      updatedPath += `?accounts=${accountIds.join(',')}`;
    }
    if (projectIds.length) {
      updatedPath += `${updatedPath.includes('?') ? '&' : '?'}projects=${projectIds.join(',')}`;
    }
    router.replace(updatedPath);
  }

  function setProjectCategory(category: string) {
    router.replace(`${router.asPath.split('?')[0]}?category=${category}`);
  }

  function exportOrgData() {
    const orgId = data?.projects[0]?.orgId;
    return requestDownload({
      api: `/api/org/${orgId}/export`,
      title: `Chart-Reuse Export`
    });
  }

  const rows = data.projects
    .map(project => {
      const score =
        project.projections.annualSummary.dollarCost.changePercent +
        project.projections.annualSummary.wasteWeight.changePercent +
        project.projections.annualSummary.singleUseProductCount.changePercent;
      return {
        ...project,
        score
      };
    })
    .sort((a, b) => a.score - b.score);

  const spacing = 24;

  return (
    <div ref={printRef}>
      <PrintHeader orgName={user.org.name} />
      <S2.HeaderRow>
        <Typography.Title className='dont-print-me'>
          {isUpstreamView ? 'Upstream Analytics' : `${user.org.name}'s Analytics`}
        </Typography.Title>

        <div style={{ display: 'flex', gap: '1em' }} className='dont-print-me'>
          <PrintButton printRef={printRef} pdfTitle={`${user.org.name} Projects Overview - Chart-Reuse`} />
          <Button onClick={() => exportOrgData()}>
            <DownloadOutlined /> Export Data
          </Button>
        </div>
      </S2.HeaderRow>

      <Spacer vertical={spacing} />

      <S2.HeaderRow>
        {showCategoryTabs ? (
          <Tabs
            activeKey={projectCategory}
            style={{ marginBottom: 0 }}
            onChange={setProjectCategory}
            items={[
              {
                key: 'default',
                label: 'Projections'
              },
              {
                key: 'event',
                label: 'Actuals'
              }
            ]}
          />
        ) : (
          <div />
        )}
        <Form layout='horizontal' style={{ minWidth: 350, maxWidth: '49%' }}>
          <Form.Item label='Filter projects'>
            <Select
              allowClear
              mode='multiple'
              defaultValue={selectedProjects}
              placeholder='Select Projects'
              onChange={handleChange}
              options={options}
            />
          </Form.Item>
        </Form>
      </S2.HeaderRow>

      <Divider style={{ margin: 0 }} />

      <Spacer vertical={spacing} />

      <Row gutter={[24, 24]}>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label='Estimated Savings'
            formatter={val => formatToDollar(val, currencyAbbreviation)}
            value={data.summary.savings}
          />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph label='Single-Use Reduction' units='units' value={data.summary.singleUse} />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label='Waste Reduction'
            units={displayAsMetric ? 'kg' : 'lbs'}
            formatter={val =>
              formattedValueInPounds(valueInPounds(val, { displayAsMetric, displayAsTons: false }), {
                displayAsMetric,
                displayAsTons: false
              })
            }
            value={data.summary.waste}
          />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph label='GHG Reduction' units='MTC02e' value={data.summary.gas} />
        </StyledCol>
      </Row>

      <div className='page-break' />

      <Spacer vertical={spacing} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Project Leaderboard
        </Typography.Title>
        <S.SectionHeader style={{ color: 'grey', marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>{`${data.projects.length} Projects`}</span>
        </S.SectionHeader>
      </div>
      <Spacer vertical={spacing} />
      <Divider style={{ margin: 0 }} />
      <Spacer vertical={spacing} />

      <Card>
        <Table<ProjectSummary>
          className='dont-print-me'
          dataSource={rows}
          columns={columns}
          rowKey='id'
          pagination={{ hideOnSinglePage: true }}
        />
        <Table<ProjectSummary>
          className='print-only'
          dataSource={rows}
          columns={columns}
          rowKey='id'
          pagination={{ hideOnSinglePage: true, pageSize: rows.length }}
        />
      </Card>
    </div>
  );
}

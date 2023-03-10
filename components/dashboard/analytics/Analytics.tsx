import { DownloadOutlined } from '@ant-design/icons';
import type { Org, User } from '@prisma/client';
import type { SelectProps } from 'antd';
import { Button, Col, Form, Row, Select, Space, Table, Typography, Divider } from 'antd';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/content-loader';
import { PrintButton } from 'components/print/print-button';
import { PrintHeader } from 'components/print/print-header';
import Card from 'components/projects/[id]/projections/components/card';
import GroupedBar from 'components/projects/[id]/projections/components/grouped-bar';
import * as S from 'components/projects/[id]/projections/components/styles';
import Spacer from 'components/spacer/spacer';
import type { SummaryValues, AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';

import * as S2 from '../styles';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;

const KPIValue = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 30px !important;
  @media print {
    font-size: 24px !important;
  }
`;

export interface PageProps {
  isUpstreamView?: boolean;
  user: User & { org: Org };
  data?: AllProjectsSummary;
  allProjects?: { id: string; name: string }[];
}

const SummaryCardWithGraph = ({ label, units, value, formatter = defaultFormatter }: { label: string; units?: string; value: SummaryValues; formatter?: (val: number) => string | ReactNode }) => {
  const graphData = {
    baseline: value.baseline,
    forecast: value.forecast
  };

  const change = (value.forecast - value.baseline) * -1;

  return (
    <Card bordered={false} style={{ height: '100%' }}>
      <Row>
        <Col xs={24} sm={13}>
          <Typography.Paragraph>
            <strong>{label}</strong>
          </Typography.Paragraph>
          <KPIValue>
            {formatter(change)} <span style={{ fontSize: '.6em' }}>{units}</span>
          </KPIValue>
        </Col>
        <Col xs={24} sm={11}>
          <GroupedBar data={graphData} formatter={val => (val ? formatter(val) : val)} />
        </Col>
      </Row>
    </Card>
  );
};

const columns = [
  {
    title: 'Name',
    key: 'name',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {record.name}
          </Typography.Title>
          <Typography.Paragraph style={{ color: 'grey', marginTop: 0, marginBottom: '1em' }}>{record.account.name}</Typography.Paragraph>
          <Typography.Text style={{ fontWeight: 500, lineHeight: 2 }}>
            Estimated Savings
            <br />
            Waste Reduction <span style={{ color: 'grey' }}>(lb)</span>
            <br />
            Single-Use Reduction <span style={{ color: 'grey' }}>(units)</span>
            <br />
            GHG Reduction <span style={{ color: 'grey' }}>(MTC02e)</span>
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Baseline',
    key: 'baseline',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            {formatToDollar(record.projections.annualSummary.dollarCost.baseline)}
            <br />
            {record.projections.annualSummary.wasteWeight.baseline.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.baseline.toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.baseline.toLocaleString()}
          </Typography.Text>
        </>
      );
    }
  },
  {
    title: 'Forecast',
    key: 'forecast',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            {formatToDollar(record.projections.annualSummary.dollarCost.forecast)}
            <br />
            {record.projections.annualSummary.wasteWeight.forecast.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.forecast.toLocaleString()}
            <br />
            {record.projections.annualSummary.greenhouseGasEmissions.total.forecast.toLocaleString()}
          </Typography.Text>
        </>
      );
    }
  },
  {
    // think of these changes as 'reductions', hence we multiply them * -1
    title: '',
    key: 'change',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text style={{ lineHeight: 2 }}>
            <ReductionValue value={record.projections.annualSummary.dollarCost} formatter={formatToDollar} />
            <ReductionValue value={record.projections.annualSummary.wasteWeight} />
            <ReductionValue value={record.projections.annualSummary.singleUseProductCount} />
            <ReductionValue value={record.projections.annualSummary.greenhouseGasEmissions.total} />
          </Typography.Text>
        </>
      );
    }
  }
];

const defaultFormatter = (val: number) => {
  return val ? val.toLocaleString() : <span style={{ color: 'grey', fontSize: '12px' }}>N/A</span>;
};

const ReductionValue = ({ value, formatter = defaultFormatter }: { value: { change: number; changePercent?: number }; formatter?: (val: number) => string | ReactNode }) => {
  const change = value.change * -1;
  const changePercent = value.changePercent ? value.changePercent * -1 : 0;
  return (
    <Row>
      <Col span={12} style={{ fontWeight: 500 }}>
        {change > 0 && '+'}
        {formatter(change)}
      </Col>
      <Col span={12} style={{ color: change < 0 ? 'red' : change > 0 ? '#2bbe50' : 'inherit' }}>
        {changePercent > 0 && '+'}
        {changePercent ? `${changePercent}%` : null}
      </Col>
    </Row>
  );
};

export default function AnalyticsPage({ user, data, allProjects, isUpstreamView }: PageProps) {
  const router = useRouter();

  // for printing
  const printRef = useRef(null);

  if (!data) {
    return <ContentLoader />;
  }

  const selectedProjects = typeof router.query.projects === 'string' ? router.query.projects.split(',') : [];

  const options: SelectProps['options'] = allProjects?.map(project => ({
    label: project.name,
    value: project.id
  }));

  function handleChange(value: string[]) {
    const updatedPath = router.asPath.split('?')[0] + (value.length ? `?projects=${value.join(',')}` : '');
    router.replace(updatedPath);
  }

  function exportData() {
    const orgId = data?.projects?.[0]?.orgId;
    return requestDownload({
      api: `/api/org/${orgId}/export`,
      title: `Chart Reuse Export`
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
      <S2.SpaceBetween>
        <Typography.Title className='dont-print-me'>{isUpstreamView ? 'Upstream Analytics' : `${user.org.name}'s Analytics`}</Typography.Title>

        <div style={{ display: 'flex', gap: '1em' }} className='dont-print-me'>
          <PrintButton printRef={printRef} pdfTitle={`${user.org.name} Projects Overview - Chart Reuse`} />
          <Button onClick={() => exportData()}>
            <DownloadOutlined /> Export Data
          </Button>
        </div>
      </S2.SpaceBetween>

      <Spacer vertical={spacing} />

      <S2.SpaceBetween>
        <Typography.Title level={3} style={{ margin: 0 }}>
          High-Level Overview
        </Typography.Title>
        <Form layout='horizontal' style={{ minWidth: 350, maxWidth: '49%' }}>
          <Form.Item label='Filter projects'>
            <Select allowClear mode='multiple' defaultValue={selectedProjects} placeholder='Select Projects' onChange={handleChange} options={options} />
          </Form.Item>
        </Form>
      </S2.SpaceBetween>

      <Divider style={{ margin: 0 }} />

      <Spacer vertical={spacing} />

      <Row gutter={[24, 24]}>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph label='Estimated Savings' formatter={formatToDollar} value={data.summary.savings} />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph label='Single-Use Reduction' units='units' value={data.summary.singleUse} />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph label='Waste Reduction' units='lbs' value={data.summary.waste} />
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
        <Table<ProjectSummary> className='dont-print-me' dataSource={rows} columns={columns} rowKey='id' pagination={{ hideOnSinglePage: true }} />
        <Table<ProjectSummary> className='print-only' dataSource={rows} columns={columns} rowKey='id' pagination={{ hideOnSinglePage: true, pageSize: rows.length }} />
      </Card>
    </div>
  );
}

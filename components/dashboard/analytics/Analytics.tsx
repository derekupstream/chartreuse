import { DownloadOutlined } from '@ant-design/icons';
import type { Org, User } from '@prisma/client';
import type { SelectProps } from 'antd';
import { Button, Col, Form, Row, Select, Space, Table, Typography, Divider } from 'antd';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import ContentLoader from 'components/content-loader';
import Spacer from 'components/spacer/spacer';
import type { SummaryValues, AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';

import Card from '../../calculator/projections/components/card';
import GroupedBar from '../../calculator/projections/components/grouped-bar';
import * as S from '../../calculator/projections/components/styles';
import * as S2 from '../styles';

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
          <Typography.Title style={{ margin: 0 }}>
            {formatter(change)} <span style={{ fontSize: '.6em' }}>{units}</span>
          </Typography.Title>
        </Col>
        <Col xs={24} sm={11}>
          <GroupedBar data={graphData} formatter={val => (val ? formatter(val) : val)} />
        </Col>
      </Row>
    </Card>
  );
};

const SummaryCard = ({ label, units, value, formatter = defaultFormatter }: { label: string; units?: string; value: number; formatter?: (val: number) => string | ReactNode }) => {
  return (
    <Card bordered={false} style={{ height: '100%' }}>
      <Typography.Paragraph>
        <strong>{label}</strong>
      </Typography.Paragraph>
      <Typography.Title style={{ margin: 0 }}>
        {formatter(value)} <span style={{ fontSize: '.6em' }}>{units}</span>
      </Typography.Title>
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

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <S2.SpaceBetween>
        <Typography.Title>{isUpstreamView ? 'Upstream Analytics' : `${user.org.name}'s Analytics`}</Typography.Title>

        <span>
          {isUpstreamView && (
            <>
              <Form layout='horizontal' style={{ minWidth: 350, width: '49%' }}>
                <Form.Item label='Filter projects'>
                  <Select allowClear mode='multiple' defaultValue={selectedProjects} placeholder='Select Projects' onChange={handleChange} options={options} />
                </Form.Item>
              </Form>
            </>
          )}
          <Button onClick={() => exportData()}>
            <DownloadOutlined /> Export Data
          </Button>
        </span>
      </S2.SpaceBetween>
      <Typography.Title level={3} style={{ margin: 0 }}>
        High-Level Overview
      </Typography.Title>
      <Divider style={{ margin: 0 }} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label='Estimated Savings' formatter={formatToDollar} value={data.summary.savings} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label='Single-Use Reduction' units='units' value={data.summary.singleUse} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label='Waste Reduction' units='lbs' value={data.summary.waste} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label='GHG Reduction' units='MTC02e' value={data.summary.gas} />
        </Col>
      </Row>

      <Spacer vertical={0} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Project Leaderboard
        </Typography.Title>
        <S.SectionHeader style={{ color: 'grey', marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>{`${data.projects.length} Projects`}</span>
        </S.SectionHeader>
      </div>
      <Divider style={{ margin: 0 }} />

      <Card>
        <Table<ProjectSummary> dataSource={rows} columns={columns} rowKey='id' />
      </Card>
    </Space>
  );
}

import { Col, Row, Space, Table, Typography, Divider } from 'antd'
import { ReactNode } from 'react'

import { Org, User } from '@prisma/client'
import Card from '../../calculator/projections/components/card'
import GroupedBar from '../../calculator/projections/components/grouped-bar'
import * as S from '../../calculator/projections/components/styles'
import Spacer from 'components/spacer/spacer'
import type { SummaryValues, AllProjectsSummary, ProjectSummary } from 'lib/calculator'
import ContentLoader from 'components/content-loader'
import { formatToDollar } from 'lib/calculator/utils'

function median(vals: number[]) {
  const sorted = vals.sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted[mid]
}

export interface PageProps {
  isUpstreamView?: boolean
  user: User & { org: Org }
  data?: AllProjectsSummary
}

const SummaryCardWithGraph = ({ label, units, value, formatter = defaultFormatter }: { label: string; units?: string; value: SummaryValues; formatter?: (val: number) => string | ReactNode }) => {
  const graphData = {
    baseline: value.baseline,
    forecast: value.forecast,
  }

  const change = value.forecast - value.baseline

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
  )
}

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
  )
}

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
          <Typography.Text>
            Estimated Savings
            <br />
            Waste Reduction <span style={{ color: 'grey' }}>(lb)</span>
            <br />
            Single-Use Reduction <span style={{ color: 'grey' }}>(units)</span>
            <br />
            GHG Reduction <span style={{ color: 'grey' }}>(MTC02e)</span>
          </Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Baseline',
    key: 'baseline',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text>
            {formatToDollar(record.projections.annualSummary.dollarCost.baseline)}
            <br />
            {record.projections.annualSummary.wasteWeight.baseline.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.baseline.toLocaleString()}
            <br />
            &nbsp;
          </Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Forecast',
    key: 'forecast',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text>
            {formatToDollar(record.projections.annualSummary.dollarCost.followup)}
            <br />
            {record.projections.annualSummary.wasteWeight.followup.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.followup.toLocaleString()}
            <br />
            &nbsp;
          </Typography.Text>
        </>
      )
    },
  },
  {
    title: 'Change',
    key: 'change',
    render: (record: ProjectSummary) => {
      return (
        <>
          <Typography.Title level={4}>&nbsp;</Typography.Title>
          <Typography.Paragraph>&nbsp;</Typography.Paragraph>
          <Typography.Text>
            <ColoredChange value={record.projections.annualSummary.dollarCost} formatter={formatToDollar} />
            <ColoredChange value={record.projections.annualSummary.wasteWeight} />
            <ColoredChange value={record.projections.annualSummary.singleUseProductCount} />
            <ColoredChange value={{ change: record.projections.annualSummary.greenhouseGasEmissions.total }} />
          </Typography.Text>
        </>
      )
    },
  },
]

const defaultFormatter = (val: number) => {
  console.log('val', val)
  return val ? val.toLocaleString() : <span style={{ color: 'grey', fontSize: '12px' }}>N/A</span>
}

const ColoredChange = ({ value, formatter = defaultFormatter }: { value: { change: number; changePercent?: number }; formatter?: (val: number) => string | ReactNode }) => (
  <Row style={{ color: value.change > 0 ? 'green' : value.change < 0 ? 'red' : 'inherit' }}>
    <Col span={12}>
      {value.change > 0 && '+'}
      {formatter(value.change)}
    </Col>
    <Col span={12}>
      {value.changePercent! > 0 && '+'}
      {value.changePercent && `${value.changePercent}%`}
    </Col>
  </Row>
)

export default function AnalyticsPage({ user, data, isUpstreamView }: PageProps) {
  if (!data) {
    return <ContentLoader />
  }

  const rows = data.projects
    .map(project => {
      const score =
        project.projections.annualSummary.dollarCost.changePercent + project.projections.annualSummary.wasteWeight.changePercent + project.projections.annualSummary.singleUseProductCount.changePercent
      return {
        ...project,
        score,
      }
    })
    .sort((a, b) => b.score - a.score)

  const orgs = new Set(rows.map(row => row.orgId))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title>{isUpstreamView ? 'Total Annual Impact' : `${user.org.name}'s Annual Impact`}</Typography.Title>

      <Typography.Title level={3} style={{ margin: 0 }}>
        High-Level Overview
      </Typography.Title>
      <Divider style={{ margin: 0 }} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label="Estimated Savings" formatter={formatToDollar} value={data.summary.savings} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label="Single-Use Reduction" units="units" value={data.summary.singleUse} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCardWithGraph label="Waste Reduction" units="lbs" value={data.summary.waste} />
        </Col>
        <Col xs={24} md={12}>
          <SummaryCard label="GHG Reduction" units="MTC02e" value={data.summary.gas.change} />
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
        <Table<ProjectSummary> dataSource={rows} columns={columns} rowKey="id" />
      </Card>
    </Space>
  )
}

import { useRouter } from 'next/router'
import { Button, Col, Row, Space, Table, Tag, Typography, Popconfirm, Divider } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import * as http from 'lib/http'
import { ReactNode } from 'react'

import { LoggedinProps } from 'lib/middleware'
import { Org, Project, User } from '@prisma/client'
import Card from '../../calculator/projections/components/card'
import KPIBullet from '../../calculator/projections/components/bullet-bar'
import * as S from '../../calculator/projections/components/styles'
import { ProjectionsResponse } from 'lib/calculator'
import Spacer from 'components/spacer/spacer'
import chartreuseClient from 'lib/chartreuseClient'
import type { AllProjectsSummary, SummaryValues, ProjectSummary } from 'pages/api/projections'
import ContentLoader from 'components/content-loader'
import useSWR from 'swr'
import { formatToDollar, round } from 'lib/calculator/utils'
import { poundsToTons } from 'lib/calculator/constants/conversions'

function median(vals: number[]) {
  const sorted = vals.sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted[mid]
}

export interface PageProps {
  user: User & { org: Org }
}

const SummaryCardWithBullet = ({ label, units, value, format = defaultFormat }: { label: string; units?: string; value: SummaryValues; format?: (val: number) => string | ReactNode }) => {
  const bulletData = {
    current: value.baseline,
    target: median(value.forecasts),
    max: Math.max(value.baseline, value.forecast),
  }
  console.log('target', value, bulletData)
  const change = value.forecast - value.baseline

  return (
    <Card bordered={false}>
      <Typography.Title>
        {format(change)} <span style={{ fontSize: '.6em' }}>{units}</span>
      </Typography.Title>
      <Typography.Paragraph>{label}</Typography.Paragraph>
      <KPIBullet data={bulletData} formatter={val => (val ? format(val) : val)} />
    </Card>
  )
}

const SummaryCard = ({ label, units, value, format = defaultFormat }: { label: string; units?: string; value: number; format?: (val: number) => string | ReactNode }) => {
  return (
    <Card bordered={false} style={{ height: '100%' }}>
      <Typography.Title>
        {format(value)} <span style={{ fontSize: '.6em' }}>{units}</span>
      </Typography.Title>
      <Typography.Paragraph>{label}</Typography.Paragraph>
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
          <Typography.Paragraph>
            Estimated Savings
            <br />
            Waste Reduction <span style={{ color: 'grey' }}>(lb)</span>
            <br />
            Single-Use Reduction <span style={{ color: 'grey' }}>(units)</span>
            <br />
            GHG Reduction <span style={{ color: 'grey' }}>(MTC02e)</span>
          </Typography.Paragraph>
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
          <Typography.Paragraph>
            {formatToDollar(record.projections.annualSummary.dollarCost.baseline)}
            <br />
            {record.projections.annualSummary.wasteWeight.baseline.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.baseline.toLocaleString()}
            <br />
            &nbsp;
          </Typography.Paragraph>
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
          <Typography.Paragraph>
            {formatToDollar(record.projections.annualSummary.dollarCost.followup)}
            <br />
            {record.projections.annualSummary.wasteWeight.followup.toLocaleString()}
            <br />
            {record.projections.annualSummary.singleUseProductCount.followup.toLocaleString()}
            <br />
            &nbsp;
          </Typography.Paragraph>
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
          <Typography.Paragraph>
            <ColoredChange value={record.projections.annualSummary.dollarCost} format={formatToDollar} />
            <ColoredChange value={record.projections.annualSummary.wasteWeight} />
            <ColoredChange value={record.projections.annualSummary.singleUseProductCount} />
            <ColoredChange value={{ change: record.projections.annualSummary.greenhouseGasEmissions.total }} />
          </Typography.Paragraph>
        </>
      )
    },
  },
]

const defaultFormat = (val: number) => (val ? val.toLocaleString() : <span style={{ color: 'grey', fontSize: '12px' }}>N/A</span>)

const ColoredChange = ({ value, format = defaultFormat }: { value: { change: number; changePercent?: number }; format?: (val: number) => string | ReactNode }) => (
  <Row style={{ color: value.change > 0 ? 'green' : value.change < 0 ? 'red' : 'inherit' }}>
    <Col span={12}>
      {value.change > 0 && '+'}
      {format(value.change)}
    </Col>
    <Col span={12}>
      {value.changePercent! > 0 && '+'}
      {value.changePercent && `${value.changePercent}%`}
    </Col>
  </Row>
)

export default function AnalyticsPage({ user }: PageProps) {
  const { data } = useSWR('/projections', () => chartreuseClient.getProjectSummaries())

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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title>{user.org.name}&apos;s Annual Impact</Typography.Title>

      <S.SectionHeader style={{ margin: 0 }}>Impact Summary of {data.projects.length} Projects</S.SectionHeader>
      <Divider style={{ margin: 0 }} />

      <Row gutter={24}>
        <Col span={12}>
          <SummaryCardWithBullet label="Estimated Savings" format={formatToDollar} value={data.summary.savings} />
        </Col>
        <Col span={12}>
          <SummaryCardWithBullet label="Single-Use Reduction" units="units" value={data.summary.singleUse} />
        </Col>
      </Row>
      <Row gutter={24}>
        <Col span={12}>
          <SummaryCardWithBullet label="Waste Reduction" units="lbs" value={data.summary.waste} />
        </Col>
        <Col span={12}>
          <SummaryCard label="GHG Reduction" units="MTC02e" value={data.summary.gas.change} />
        </Col>
      </Row>

      <Spacer vertical={0} />

      <Typography.Title level={2} style={{ marginBottom: 0 }}>
        Project Leaderboard
      </Typography.Title>
      <Divider style={{ margin: 0 }} />

      <Card>
        <Table<ProjectSummary> dataSource={rows} columns={columns} />
      </Card>
    </Space>
  )
}

import { BarChartOutlined, TableOutlined } from '@ant-design/icons'
import { Radio, Table, Typography, Menu, Dropdown } from 'antd'
import { ProjectionsResponse } from 'lib/calculator'
import Spacer from 'components/spacer/spacer'
import BarChart from '../components/chart-bar'
import { CardTitle, ChartTitle, Divider, SectionContainer, SectionHeader } from '../components/styles'
import { KPIContent } from '../components/kpi-card'
import Tag from '../components/tag'
import { changeValue } from 'lib/number'
import { Card, Body, Section, Header, Value, Row, Label } from './styles'
import { useState } from 'react'
import { formatToDollar } from 'lib/calculator/utils'

interface TableData {
  product: string
  baselineSpending: number
  forecastSpending: number
  gasReductions: number
  change: string
}

const columns = [
  {
    title: 'Product',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Baseline',
    dataIndex: 'baselineStr',
    key: 'baselineSpending',
  },
  {
    title: 'Forecast',
    dataIndex: 'forecastStr',
    key: 'forecastSpending',
  },
  {
    title: 'Change',
    dataIndex: 'change',
    key: 'change',
  },
]

const gasColumns = [
  {
    title: 'Product',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Greenhouse Reduction (MTCO2e)',
    dataIndex: 'reductionStr',
    key: 'reductionStr',
  },
  {
    title: 'Share of Reduction',
    dataIndex: 'reductionShareStr',
    key: 'reductionShareStr',
  },
  {
    title: 'Change',
    dataIndex: 'change',
    key: 'change',
  },
]

type Props = {
  data: ProjectionsResponse
}

type RowType = 'productCategory' | 'productType' | 'material'
type ChangeType = 'cost' | 'waste' | 'ghg'

const SingleUseDetails: React.FC<Props> = ({ data }) => {
  const [rowType, setRowType] = useState<RowType>('productType')
  const [changeType, setChangeType] = useState<ChangeType>('cost')
  const [useTons, setUseTons] = useState(false)

  const savingsData = [
    { label: 'Baseline', value: data.annualSummary.dollarCost.baseline },
    { label: 'Forecast', value: data.annualSummary.dollarCost.followup },
  ]

  const singleUseData = [
    { label: 'Baseline', value: data.annualSummary.singleUseProductCount.baseline },
    { label: 'Forecast', value: data.annualSummary.singleUseProductCount.followup },
  ]

  function changeRowType(e: any) {
    setRowType(e.target.value)
  }

  function changeChangeType(e: any) {
    setChangeType(e.target.value)
  }

  function changeWeightType(e: any) {
    setUseTons(e.target.value === 'tons')
  }

  function formatNumber(value: number) {
    if (changeType === 'cost') {
      return formatToDollar(value)
    }
    return value.toLocaleString()
  }

  const items = data.singleUseProductResults.resultsByType[rowType]
  const dataSource: TableData[] = items.rows.map((item, index) => {
    let baseline = 0
    let forecast = 0
    if (changeType === 'cost') {
      baseline = item.cost.baseline
      forecast = item.cost.followup
    } else if (changeType === 'waste') {
      baseline = item.weight.baseline
      forecast = item.weight.followup
      if (useTons) {
        baseline = baseline / 2000
        forecast = forecast / 2000
      }
    }
    return {
      key: index, // for @antd/table
      product: item.title,
      baselineSpending: baseline,
      forecastStr: formatNumber(forecast),
      baselineStr: formatNumber(baseline),
      // for gas\
      gasReductions: item.gasEmissions.reduction,
      reductionStr: formatNumber(item.gasEmissions.reduction),
      reductionShareStr: formatNumber(item.gasEmissions.shareOfReduction * 100) + '%',
      forecastSpending: forecast,
      change: baseline ? `${formatNumber(forecast - baseline)} (${forecast > baseline ? '-' : ''}${Math.round(((forecast - baseline) / baseline) * 100)}%)` : 'N/A',
    }
  })

  return (
    <SectionContainer>
      <SectionHeader>Single-use details report</SectionHeader>
      <Divider />
      <Card>
        <CardTitle>Your estimated annual savings</CardTitle>
        <Body>
          <Section>
            <KPIContent
              change={data.annualSummary.dollarCost.change * -1}
              changePercent={data.annualSummary.dollarCost.changePercent * -1}
              changeStr={`${changeValue(data.annualSummary.dollarCost.change * -1, { preUnit: '$' }).toLocaleString()}`}
            />
            {/* <ChartTitle>Annual Spending changes</ChartTitle> */}
            <BarChart data={savingsData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField="label" />
          </Section>

          <Section>
            <KPIContent
              change={data.annualSummary.singleUseProductCount.change * -1}
              changePercent={data.annualSummary.singleUseProductCount.changePercent * -1}
              changeStr={changeValue(data.annualSummary.singleUseProductCount.change * -1) + ' units'}
            />
            {/* <ChartTitle>Annual single-use total changes</ChartTitle> */}
            <BarChart data={singleUseData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} pieces`} seriesField="label" />
          </Section>
        </Body>
      </Card>

      <SectionHeader>Single-use purchasing</SectionHeader>
      <Divider />
      <Card>
        <Row spaceBetween>
          <CardTitle>Cost</CardTitle>
          <Row marginBottom={15}>
            <Label>View change in</Label>
            <Radio.Group defaultValue="cost" buttonStyle="solid" onChange={changeChangeType}>
              <Radio.Button value="cost">Cost</Radio.Button>
              <Radio.Button value="waste">Waste</Radio.Button>
              <Radio.Button value="ghg">GHG</Radio.Button>
            </Radio.Group>
            <Spacer horizontal={16} />
            {/* <Radio.Group defaultValue="waste" buttonStyle="solid" onChange={console.log}>
              <Radio.Button value="waste">
                <BarChartOutlined />
              </Radio.Button>
              <Radio.Button value="ghg">
                <TableOutlined />
              </Radio.Button>
            </Radio.Group> */}
          </Row>
        </Row>

        <Row marginBottom={16} spaceBetween>
          <Row>
            <Label>View results by</Label>
            <Radio.Group defaultValue="productType" buttonStyle="solid" onChange={changeRowType}>
              <Radio.Button value="productType">Product</Radio.Button>
              <Radio.Button value="productCategory">Category</Radio.Button>
              <Radio.Button value="material">Material</Radio.Button>
            </Radio.Group>
            <Spacer horizontal={16} />
            {changeType === 'waste' && (
              <Radio.Group defaultValue={useTons ? 'tons' : 'pounds'} buttonStyle="solid" onChange={changeWeightType}>
                <Radio.Button value="pounds">Pounds</Radio.Button>
                <Radio.Button value="tons">Tons</Radio.Button>
              </Radio.Group>
            )}
          </Row>
          {/*
          <div>
            Sort By:
            <Dropdown.Button
              onClick={console.log}
              overlay={
                <Menu onClick={console.log}>
                  <Menu.Item key="1">1st menu item</Menu.Item>
                  <Menu.Item key="2">2nd menu item</Menu.Item>
                  <Menu.Item key="3">3rd menu item</Menu.Item>
                </Menu>
              }
            >
              Dropdown
            </Dropdown.Button>
          </div> */}
        </Row>
        <Spacer horizontal={16} />
        <Table<TableData>
          dataSource={dataSource}
          columns={changeType === 'ghg' ? gasColumns : columns}
          summary={pageData => {
            const baselineTotal = pageData.reduce((acc, curr) => acc + curr.baselineSpending, 0)
            const forecastTotal = pageData.reduce((acc, curr) => acc + curr.forecastSpending, 0)
            const gasReductionsTotal = pageData.reduce((acc, curr) => acc + curr.gasReductions, 0)

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                {changeType === 'ghg' ? (
                  <>
                    <Table.Summary.Cell index={1}>
                      <Typography.Text strong>{formatNumber(gasReductionsTotal)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Typography.Text strong>100%</Typography.Text>
                    </Table.Summary.Cell>
                  </>
                ) : (
                  <>
                    <Table.Summary.Cell index={1}>
                      <Typography.Text strong>{formatNumber(baselineTotal)}</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Typography.Text strong>{formatNumber(forecastTotal)}</Typography.Text>
                    </Table.Summary.Cell>
                  </>
                )}
                <Table.Summary.Cell index={3}>
                  <Typography.Text strong>{formatNumber(forecastTotal - baselineTotal)}</Typography.Text>
                  {/* <Tag>76%</Tag> */}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </SectionContainer>
  )
}

export default SingleUseDetails

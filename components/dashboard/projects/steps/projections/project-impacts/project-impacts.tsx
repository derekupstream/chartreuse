import { ProjectionsResponse } from 'internal-api/calculator'
import React from 'react'
import { Divider, SectionContainer, SectionHeader, ChartTitle } from '../components/styles'
import Card from './components/kpi-card'
import { Row, Col } from 'antd'
import { changeValue } from 'lib/number'
import BarChart from '../components/chart-bar'

type Props = {
  data: ProjectionsResponse['annualSummary']
}

const ProjectImpacts: React.FC<Props> = ({ data }) => {
  console.log('data', data)

  const savingsData = [
    { label: 'Baseline', value: data.dollarCost.baseline },
    { label: 'Forecast', value: data.dollarCost.followup },
  ]

  const singleUseData = [
    { label: 'Baseline', value: data.singleUseProductCount.baseline },
    { label: 'Forecast', value: data.singleUseProductCount.followup },
  ]

  const wasteData = [
    { label: 'Baseline', value: data.wasteWeight.baseline },
    { label: 'Forecast', value: data.wasteWeight.followup },
  ]

  const ghgData = [{ label: 'Forecast', value: data.greenhouseGasEmissions.total }]

  return (
    <SectionContainer>
      <SectionHeader>Project Impacts</SectionHeader>
      <Divider />
      <Row gutter={[30, 24]}>
        <Col span={12}>
          <Card
            title="Your estimated annual savings"
            change={data.dollarCost.change}
            changePercent={data.dollarCost.changePercent * -1}
            changeStr={`${changeValue(data.dollarCost.change * -1, { preUnit: '$' }).toLocaleString()}`}
          >
            <br />
            <BarChart data={savingsData} formatter={(data: any) => `${data.label}: $${data.value.toLocaleString()}`} seriesField="label" />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="Reductions in single-use purchasing"
            change={data.singleUseProductCount.change}
            changePercent={data.singleUseProductCount.changePercent * -1}
            changeStr={changeValue(data.singleUseProductCount.change * -1) + ' units'}
          >
            <br />
            <BarChart data={singleUseData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} pieces`} seriesField="label" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Your waste reductions" change={data.wasteWeight.change * -1} changePercent={data.wasteWeight.changePercent * -1} changeStr={changeValue(data.wasteWeight.change * -1) + ' lbs'}>
            <br />
            <BarChart data={wasteData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} lbs`} seriesField="label" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Your GHG reductions" change={data.greenhouseGasEmissions.total * -1} changeStr={changeValue(data.greenhouseGasEmissions.total * -1) + ' MTC02e'}>
            <br />
            <BarChart data={ghgData} formatter={(data: any) => `${data.label}: ${data.value.toLocaleString()} MTC02e`} seriesField="label" />
          </Card>
        </Col>
      </Row>
    </SectionContainer>
  )
}

export default ProjectImpacts

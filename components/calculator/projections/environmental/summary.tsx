import { Radio, RadioChangeEvent, Typography, Row, Col } from 'antd'
import { ProjectionsResponse } from 'lib/calculator'
import { changeValue } from 'lib/number'
import { useState } from 'react'
import BigNumber from '../components/big-number'
import Card from '../components/card'
import { SectionContainer, SectionHeader } from '../components/styles'
import TitleWithTooltip from '../components/title-with-tooltip'
import Chart from '../components/chart-column'
import { poundsToTons } from 'lib/calculator/constants/conversions'
import { ViewResultsWrapper, BigNumberWrapper, ChartTitle } from './components/styles'

type Props = {
  data: ProjectionsResponse['environmentalResults']
}

const EnvironmentalSummary: React.FC<Props> = ({ data }) => {
  const [units, setUnits] = useState<'pounds' | 'tons'>('pounds')
  const onChangeResults = (event: RadioChangeEvent) => {
    setUnits(event.target.value)
  }

  function formatWeight(value: number) {
    return units === 'pounds' ? value : poundsToTons(value)
  }

  const annualWasteData = [
    {
      label: 'Single-Use Product Weight',
      value: formatWeight(data.annualWasteChanges.disposableProductWeight.baseline),
      wasteType: 'Baseline',
    },
    {
      label: 'Single-Use Product Weight',
      value: formatWeight(data.annualWasteChanges.disposableProductWeight.followup),
      wasteType: 'Forecast',
    },
    {
      label: 'Disposable Shipping Box Weight',
      value: formatWeight(data.annualWasteChanges.disposableShippingBoxWeight.baseline),
      wasteType: 'Baseline',
    },
    {
      label: 'Disposable Shipping Box Weight',
      value: formatWeight(data.annualWasteChanges.disposableShippingBoxWeight.followup),
      wasteType: 'Forecast',
    },
  ]

  const ghgData = [
    {
      label: 'Landfill waste (EPA WARM)',
      value: data.annualGasEmissionChanges.landfillWaste,
    },
  ]
  console.log('data.annualGasEmissionChanges.dishwashing', data.annualGasEmissionChanges.dishwashing)
  if (data.annualGasEmissionChanges.dishwashing) {
    ghgData.push({
      label: 'Dishwashing',
      value: data.annualGasEmissionChanges.dishwashing,
    })
  }

  return (
    <SectionContainer>
      <SectionHeader>Environmental summary</SectionHeader>

      <ViewResultsWrapper>
        <Typography.Text css="margin-right: 20px;">View results in:</Typography.Text>
        <Radio.Group onChange={onChangeResults} defaultValue={units}>
          <Radio.Button value="pounds">Pounds</Radio.Button>
          <Radio.Button value="tons">Tons</Radio.Button>
        </Radio.Group>
      </ViewResultsWrapper>

      <Row gutter={30}>
        <Col span={12}>
          <Card>
            <TitleWithTooltip title="Your total annual waste changes" />

            <BigNumberWrapper>
              <BigNumber value={`${changeValue(formatWeight(data.annualWasteChanges.total.change))} ${units === 'pounds' ? 'lbs.' : 'tons'}`} />
            </BigNumberWrapper>

            <ChartTitle>Annual waste changes</ChartTitle>
            <Chart data={annualWasteData} seriesField="wasteType" />
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <TitleWithTooltip title="Annual net GHG emissions changes" />

            <BigNumberWrapper>
              <BigNumber value={`${changeValue(data.annualGasEmissionChanges.total)} MTCO2e`} />
            </BigNumberWrapper>

            <ChartTitle>Annual greenhouse gas changes</ChartTitle>
            <Chart data={ghgData} />
          </Card>
        </Col>
      </Row>
    </SectionContainer>
  )
}

export default EnvironmentalSummary

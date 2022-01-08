import { FallOutlined, SwapRightOutlined } from '@ant-design/icons'
import { Row, Col, Typography } from 'antd'
import { Text, Title, Value } from './components/styles'
import Card from '../components/card'
import { FooterData } from './components/footer'
import TitleWithTooltip from '../components/title-with-tooltip'
import { ProjectionsResponse } from 'lib/calculator'
import { formatToDollar } from 'lib/calculator/utils'
import { SectionContainer, SectionHeader } from '../components/styles'

type Props = {
  data: ProjectionsResponse['financialResults']
}

const FinancialSummary: React.FC<Props> = ({ data }) => {
  return (
    <SectionContainer>
      <SectionHeader>Financial summary</SectionHeader>

      <Card>
        <TitleWithTooltip title="Annual program saving &amp; expenses" tooltipTitle="title" tooltipContent={<p>some description</p>} />

        <Row gutter={40}>
          <Col span={8}>
            <Text strong>Savings</Text>
            <Title>Annual total</Title>
            <Value color="green">{formatToDollar(data.summary.annualCost * -1)}</Value>

            <Title>Annual program ROI</Title>
            <Value>{data.summary.annualROIPercent}</Value>

            <hr />

            <FooterData title="Single-use purchasing" value={formatToDollar(data.annualCostChanges.singleUseProductChange)} />
            <FooterData title="Waste hauling" value={formatToDollar(data.annualCostChanges.wasteHauling)} />
          </Col>

          <Col span={8}>
            <Text strong>One-time expenses</Text>

            <Title>Annual total</Title>
            <Value color="black">{formatToDollar(data.oneTimeCosts.total)}</Value>

            <Title>Payback Period</Title>
            <Value>{data.summary.paybackPeriodsMonths} mos.</Value>

            <hr />

            <FooterData title="Reusable purchasing" value={formatToDollar(data.oneTimeCosts.reusableProductCosts)} />
            <FooterData title="Additional one-time expenses" value={formatToDollar(data.oneTimeCosts.additionalCosts)} />
          </Col>

          <Col span={8}>
            <Text strong>Recurring expenses</Text>
            <Title>Annual total</Title>
            <Value color="black">{formatToDollar(data.annualCostChanges.change - data.annualCostChanges.singleUseProductChange)}</Value>

            <hr />

            <FooterData title="Reusables restocking" value={formatToDollar(data.annualCostChanges.reusableProductCosts)} />
            <FooterData title="Labor" value={formatToDollar(data.annualCostChanges.laborCosts)} />
            <FooterData title="Dishwashing" value={formatToDollar(data.annualCostChanges.utilities)} />
            <FooterData title="Waste hauling" value={formatToDollar(data.annualCostChanges.wasteHauling)} />
            <FooterData title="Recurring additional expenses" value={formatToDollar(data.annualCostChanges.otherExpenses)} />
          </Col>
        </Row>
      </Card>
    </SectionContainer>
  )
}

export default FinancialSummary

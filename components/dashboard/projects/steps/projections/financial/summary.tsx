import { FallOutlined, SwapRightOutlined } from '@ant-design/icons'
import { Tag, Typography } from 'antd'
import { Background, CardsBox, Card, Text, Col, Title, Value } from './components/styles'
import { FooterData } from './components/footer'
import TitleWithTooltip from '../components/title-with-tooltip'
import { ProjectionsResponse } from 'internal-api/calculator'

const FinancialSummary = ({ projections }: { projections: ProjectionsResponse }) => {
  return (
    <>
      <Typography.Title level={2}>Financial summary</Typography.Title>

      <Typography.Title level={5}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed aliquam massa vel erat commodo, ut aliquam nibh convallis. Vivamus ullamcorper magna non sollicitudin pellentesque.
      </Typography.Title>

      <Background>
        <TitleWithTooltip title="Annual program saving &amp; expenses" tooltipTitle="title" tooltipContent={<p>some description</p>} />
        <CardsBox>
          <Card>
            <Text strong>Savings</Text>
            <Tag icon={<FallOutlined />} color="success">
              73%
            </Tag>

            <Col>
              <Title fontSize={11}>Annual total</Title>
              <Value color="green">$ 1000.00</Value>
            </Col>

            <Col>
              <Title fontSize={14}>Annual program ROI</Title>
              <Value>100%</Value>
            </Col>

            <hr />

            <FooterData title="Single use purchasing" value="- $59.000" />
            <FooterData title="Waste hauling" value="- 480" />
          </Card>

          <Card>
            <Text strong>One-time expenses</Text>
            <Tag icon={<SwapRightOutlined />} color="default">
              10%
            </Tag>

            <Col>
              <Title fontSize={11}>Annual total</Title>
              <Value color="black">{`$${projections.financialResults.oneTimeCosts.total.toLocaleString()}`}</Value>
            </Col>

            <Col>
              <Title fontSize={14}>Payback Period</Title>
              <Value>6.5 mos.</Value>
            </Col>

            <hr />

            <FooterData title="Reusable purchasing" value={`$${projections.financialResults.annualCostChanges.reusableProductCosts.toLocaleString()}`} />
            <FooterData title="Additional one-time expenses" value={`$${projections.financialResults.oneTimeCosts.additionalCosts.toLocaleString()}`} />
          </Card>

          <Card>
            <Text strong>Recurring expenses</Text>
            <Tag icon={<SwapRightOutlined />} color="default">
              10%
            </Tag>

            <Col>
              <Title fontSize={11}>Annual total</Title>
              <Value color="black">$ 6600.00</Value>
            </Col>

            <hr />

            <FooterData title="Reusables restocking" value="$ 5.000" />
            <FooterData title="Dishwashing" value="$ 480" />
            <FooterData title="Labor" value="$ 27.000" />
            <FooterData title="Recurring additional expenses" value="$ 1.234" />
          </Card>
        </CardsBox>
      </Background>
    </>
  )
}

export default FinancialSummary

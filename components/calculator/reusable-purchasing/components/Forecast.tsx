import { Col, Row, Typography } from 'antd'
import { InfoCard, SmallText, SmallerText } from '../../styles'
import { FC } from 'react'
import { ReusableLineItem } from 'lib/calculator/types/projects'
import { formatToDollar, round } from 'lib/calculator/utils'

interface Props {
  item: ReusableLineItem
}

const Forecast: FC<Props> = ({ item }) => {
  const oneTimeCost = item.caseCost * item.casesPurchased
  const annualCost = oneTimeCost * item.annualRepurchasePercentage

  return (
    <InfoCard theme="forecast">
      <Row>
        <Col span={17}>
          <Typography.Title level={5}>Repurchase Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <SmallText>Total</SmallText>
        </Col>
      </Row>
      <Row>
        <Col span={17}>
          <SmallText>Annual rate</SmallText>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>{`${round(item.annualRepurchasePercentage * 100)}%`}</strong>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={17}>
          <SmallText>Annual cost</SmallText>
          <br />
          <SmallerText>
            ({formatToDollar(item.caseCost)}/case x {item.casesPurchased * item.annualRepurchasePercentage})
          </SmallerText>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>{formatToDollar(annualCost)}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </InfoCard>
  )
}

export default Forecast

import { Col, Row, Typography } from 'antd'
import { InfoCard } from '../../styles'
import { FC } from 'react'
import { ReusableLineItem } from 'lib/calculator/types/projects'
import { formatToDollar } from 'lib/calculator/utils'

interface Props {
  item: ReusableLineItem
}

const Forecast: FC<Props> = ({ item }) => {
  const annualCost = item.annualRepurchasePercentage * item.caseCost
  console.log('forecast', item)
  return (
    <InfoCard theme="forecast">
      <Row>
        <Col span={17}>
          <Typography.Title level={5}>Repurchase Forecast</Typography.Title>
        </Col>
        <Col span={7}>
          <Typography.Text css="font-size: .8rem">Total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={17}>
          <Typography.Text css="font-size: .8rem">Annual rate</Typography.Text>
        </Col>
        <Col span={7}>
          <Typography.Text>
            <strong>{`${item.annualRepurchasePercentage * 100}%`}</strong>
          </Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={17}>
          <Typography.Text css="font-size: .8rem">Annual cost</Typography.Text>
          <br />
          <Typography.Text css="font-size: .7rem">
            ({formatToDollar(item.caseCost)}/case x {item.casesPurchased * item.annualRepurchasePercentage})
          </Typography.Text>
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

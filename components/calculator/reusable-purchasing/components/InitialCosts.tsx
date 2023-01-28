import { Col, Row, Typography } from 'antd'
import { InfoCard, SmallText, SmallerText } from '../../styles'
import { FC } from 'react'
import { ReusableLineItem } from 'lib/inventory/types/projects'
import { formatToDollar } from 'lib/calculator/utils'
import styled from 'styled-components'

interface Props {
  item: ReusableLineItem
}

const InitialCosts: FC<Props> = ({ item }) => {
  const annualCost = item.caseCost * item.casesPurchased

  return (
    <InfoCard theme="baseline">
      <Row>
        <Col span={16}>
          <Typography.Title level={5}>Initial Costs</Typography.Title>
        </Col>
        <Col span={8}>
          <Typography.Text>Total</Typography.Text>
        </Col>
      </Row>
      <Row>
        <Col span={16}>
          <SmallText>Total one-time cost</SmallText>
          <br />
          <SmallerText>
            ({formatToDollar(item.caseCost)}/case x {item.casesPurchased})
          </SmallerText>
        </Col>
        <Col span={8}>
          <Typography.Text>
            <strong>{formatToDollar(annualCost)}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </InfoCard>
  )
}

export default InitialCosts

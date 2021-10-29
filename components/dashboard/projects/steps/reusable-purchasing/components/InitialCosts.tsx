import { Col, Row, Typography } from 'antd'
import { StyledCard } from '../../styles'
import { FC } from 'react'
import { ReusableLineItem } from 'internal-api/calculator/types/projects'
import { formatToDollar } from 'internal-api/calculator/utils'

interface Props {
  item: ReusableLineItem
}

const annual = 12

const InitialCosts: FC<Props> = ({ item }) => {
  const annualCost = 12 * item.caseCost * item.casesPurchased

  return (
    <StyledCard css="background: #ddd">
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
          <Typography.Text css="font-size: .8rem">Total one-time cost</Typography.Text>
          <br />
          <Typography.Text css="font-size: .7rem">
            ({formatToDollar(item.caseCost)}/case x {annual})
          </Typography.Text>
        </Col>
        <Col span={8}>
          <Typography.Text>
            <strong>{formatToDollar(annualCost)}</strong>
          </Typography.Text>
        </Col>
      </Row>
    </StyledCard>
  )
}

export default InitialCosts

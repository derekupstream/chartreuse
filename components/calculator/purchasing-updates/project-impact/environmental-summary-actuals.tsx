import { Col, Row as AntdRow, Form, Select } from 'antd'
import { CardTitle } from '../../projections/components/styles'
import { Card, Row } from '../../projections/single-use-details/styles'

export function EnvironmentalSummary() {
  return (
    <>
      <AntdRow>
        <Col span={12}>
          <Card>
            <Row spaceBetween flexStart>
              <CardTitle>Your total annual waste changes</CardTitle>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Row spaceBetween flexStart>
              <CardTitle>Annual net GHG emissions changes</CardTitle>
            </Row>
          </Card>
        </Col>
      </AntdRow>
    </>
  )
}

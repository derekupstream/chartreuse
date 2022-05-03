import { Typography, Form, Button, Input } from 'antd'
import React from 'react'
import * as S from '../styles'
import { LeftOutlined } from '@ant-design/icons'

type ReusableSecondPartForm = { casesAnnually: number }

type Props = {
  form: { productName: string }
  onPressPrevious(): void
  onPressSubmit(values: ReusableSecondPartForm): void
}

const ReusablePurchasingSecondStepForm: React.FC<Props> = props => {
  const { form, onPressPrevious, onPressSubmit } = props
  return (
    <div>
      <p>You will occasionally need to replenish reusable stock due to loss, damage, or breakage. Estimate the number of cases you will need to re-purchase.</p>
      <Typography.Title level={3}>{form.productName}</Typography.Title>
      <Form layout="vertical" onFinish={onPressSubmit}>
        <Form.Item label="Cases Repurchased Annually" name="casesAnnually" rules={[{ required: true, message: 'This field is required' }]}>
          <Input type="number" autoFocus />
        </Form.Item>

        <S.BoxEnd>
          <Button htmlType="button" onClick={onPressPrevious} icon={<LeftOutlined />}>
            Previous
          </Button>
          <Button htmlType="submit" type="primary">
            Add forecast
          </Button>
        </S.BoxEnd>
      </Form>
    </div>
  )
}

export default ReusablePurchasingSecondStepForm

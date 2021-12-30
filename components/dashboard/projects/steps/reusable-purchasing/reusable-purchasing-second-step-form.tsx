import { Typography, Form, Button, Input } from 'antd'
import React from 'react'
import { FC } from 'hoist-non-react-statics/node_modules/@types/react'
import * as S from '../styles'
import { LeftOutlined } from '@ant-design/icons'
import { ReusableSecondPartForm } from '.'

type Props = {
  form: { productName: string }
  onPressPrevious(): void
  onPressSubmit(values: ReusableSecondPartForm): void
}

const ReusablePurchasingSecondStepForm: FC<Props> = props => {
  const { form, onPressPrevious, onPressSubmit } = props

  return (
    <div>
      <Typography.Title level={2}>Estimate annual reusable re-purchasing rate</Typography.Title>
      <p>You’ll occassionally need to replenish your reusable stock due to product loss (breakage, damage, loss, etc.). Calculate your re-purchase rate by ___________________________.</p>
      <Typography.Title level={3}>{form.productName}</Typography.Title>
      <Form layout="vertical" onFinish={onPressSubmit}>
        <Form.Item label="Cases Annually" name="annualRepurchasePercentage" rules={[{ required: true, message: 'This field is required' }]}>
          <Input type="number" />
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

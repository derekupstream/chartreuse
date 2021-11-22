import { Typography, Form, Button, InputNumber, Input } from 'antd'
import React from 'react'
import { FC } from 'hoist-non-react-statics/node_modules/@types/react'
import * as S from '../styles'
import { LeftOutlined } from '@ant-design/icons'
import { useForm } from 'antd/lib/form/Form'

type FormValues = {}

type Props = {
  onPressPrevious(): void
  onPressSubmit(values: any): void
}

const ReusablePurchasingLastStepForm: FC<Props> = props => {
  const { onPressPrevious, onPressSubmit } = props

  const [form] = useForm()
  console.log(form)

  return (
    <div>
      <Typography.Title level={2}>Estimate annual reusable re-purchasing rate</Typography.Title>
      <Typography.Title level={4}>
        You’ll occassionally need to replenish your reusable stock due to product loss (breakage, damage, loss, etc.). Calculate your re-purchase rate by ___________________________.
      </Typography.Title>
      <Typography.Title level={3}>Acopa Liana 10 1/2&quot; Wide Rim Porcelain Plate</Typography.Title>
      <Form layout="vertical" onFinish={console.log}>
        <Form.Item label="Product name" name="productName">
          <Input />
        </Form.Item>

        <Form.Item label="Cases purchased" name="casesPurchased">
          <Input />
        </Form.Item>

        <Form.Item label="Cost per case" name="caseCost">
          <InputNumber formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>

        <S.BoxEnd>
          <div></div>
          <Button htmlType="submit" type="primary">
            {'Next >'}
          </Button>
        </S.BoxEnd>
      </Form>
    </div>
  )
}

export default ReusablePurchasingLastStepForm

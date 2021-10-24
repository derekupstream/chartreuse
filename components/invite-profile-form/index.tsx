import { RightOutlined } from '@ant-design/icons'
import { Form, Input, Button } from 'antd'

import * as S from './styles'

type Props = {
  onSubmit: (values: unknown) => void
  isLoading?: boolean
}

export default function InviteProfileForm({ onSubmit, isLoading }: Props) {
  return (
    <S.Wrapper>
      <S.InviteProfileForm name="orgAccount" layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Your name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please input your name!',
            },
          ]}
        >
          <Input placeholder="Your name" />
        </Form.Item>

        <Form.Item label="Your job title" name="title" rules={[{ required: true, message: 'Please input your title!' }]}>
          <Input placeholder="Your job title" />
        </Form.Item>

        <Form.Item
          label="Your contact phone number"
          name="phone"
          rules={[
            {
              required: true,
              message: 'Please input your phone!',
            },
          ]}
        >
          <Input placeholder="(720) 555-1234" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Create Account <RightOutlined />
          </Button>
        </Form.Item>
      </S.InviteProfileForm>
    </S.Wrapper>
  )
}

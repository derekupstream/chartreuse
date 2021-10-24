import { RightOutlined } from '@ant-design/icons'
import { Form, Input, Button, Select } from 'antd'

import * as S from './styles'

type Props = {
  onSubmit: (values: unknown) => void
  isLoading?: boolean
  accounts: {
    id: string
    name: string
  }[]
}

export default function InviteForm({ onSubmit, isLoading, accounts }: Props) {
  return (
    <S.Wrapper>
      <S.InviteForm name="inviteForm" layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Choose account to assign member"
          name="accountId"
          rules={[
            {
              required: true,
              message: 'Account is required!',
            },
          ]}
        >
          <Select placeholder="Account name">
            {accounts.map(account => {
              return (
                <Select.Option key={account.id} value={account.id}>
                  {account.name}
                </Select.Option>
              )
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label="Account member's email"
          name="email"
          rules={[
            {
              required: true,
              message: 'Email is required!',
            },
            {
              type: 'email',
              message: 'Please input a valid email!',
            },
          ]}
        >
          <Input type="email" placeholder="Account member's email" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Invite Member <RightOutlined />
          </Button>
        </Form.Item>
      </S.InviteForm>
    </S.Wrapper>
  )
}

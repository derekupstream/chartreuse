import { Form, Input, Button, Select } from 'antd'
import { Store } from 'antd/lib/form/interface'

import * as S from './styles'

type Props = {
  onSubmit: (values: any) => void
  onCancel: () => void
  isLoading?: boolean
  initialValues?: Store
  accounts: {
    id: string
    name: string
  }[]
}

export default function MemberEditForm({ onSubmit, onCancel, isLoading, initialValues, accounts }: Props) {
  return (
    <S.Wrapper>
      <S.MemberEditForm initialValues={initialValues} name="memberEdit" layout="vertical" onFinish={onSubmit}>
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
          label="Account members's name"
          name="name"
          rules={[
            {
              required: true,
              message: "Please input the member's name!",
            },
          ]}
        >
          <Input placeholder="Account member's name" />
        </Form.Item>

        <Form.Item
          label="Account members's email"
          name="email"
          rules={[
            {
              required: true,
              message: "Please input the member's email!",
            },
            {
              type: 'email',
              message: 'Please input a valid email!',
            },
          ]}
        >
          <Input placeholder="Account member's email" />
        </Form.Item>

        <Form.Item
          label="Account members's job title"
          name="title"
          rules={[
            {
              required: true,
              message: "Please input the member's job title!",
            },
          ]}
        >
          <Input placeholder="Account member's job title" />
        </Form.Item>

        <Form.Item
          label="Account members's phone"
          name="phone"
          rules={[
            {
              required: true,
              message: "Please input the member's phone!",
            },
          ]}
        >
          <Input placeholder="Account member's phone" />
        </Form.Item>

        <Form.Item>
          <S.ActionsSpace>
            <Button block onClick={onCancel}>
              Cancel
            </Button>
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Save
            </Button>
          </S.ActionsSpace>
        </Form.Item>
      </S.MemberEditForm>
    </S.Wrapper>
  )
}

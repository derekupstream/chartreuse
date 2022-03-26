import { Form, Input, Button, Select, Typography } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { STATES } from 'lib/calculator/constants/utilities'

import * as S from './styles'

type Props = {
  onSubmit: (values: unknown) => void
  onCancel: () => void
  isLoading?: boolean
  initialValues?: Store
}

export default function AccountEditForm({ onSubmit, onCancel, isLoading, initialValues }: Props) {
  return (
    <S.Wrapper>
      <S.AccountEditForm initialValues={initialValues} name="accountEdit" layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Account Company Name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please input the company name!',
            },
          ]}
        >
          <Input placeholder="Company name" />
        </Form.Item>

        <Form.Item label="Account US State" name="USState">
          <Select showSearch style={{ width: '100%' }}>
            {STATES.map(state => (
              <Select.Option key={state.name} value={state.name}>
                {state.name}
              </Select.Option>
            ))}
          </Select>
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
      </S.AccountEditForm>
    </S.Wrapper>
  )
}

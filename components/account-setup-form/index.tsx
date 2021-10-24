import { RightOutlined } from '@ant-design/icons'
import { Form, Input, Button, Checkbox } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useAuth } from 'hooks/useAuth'
import { useState } from 'react'

import * as S from './styles'

type Props = {
  onSubmit: (values: unknown) => void
  isLoading?: boolean
}

export default function AccountSetupForm({ onSubmit, isLoading }: Props) {
  const { user } = useAuth()
  const [form] = Form.useForm()
  const [useOrgEmail, setUseOrgEmail] = useState<boolean>(false)

  const handleUseOrgEmailChange = (e: CheckboxChangeEvent) => {
    const { checked } = e.target
    setUseOrgEmail(checked)
    form.setFieldsValue({
      useOrgEmail: checked,
      email: checked ? user?.email : '',
    })
  }

  return (
    <S.Wrapper>
      <S.AccountSetupForm form={form} name="accountSetup" layout="vertical" onFinish={onSubmit}>
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

        <Form.Item
          label="Account Contact's Email"
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
          <Input type="email" placeholder="Your email" disabled={useOrgEmail} />
        </Form.Item>

        <Form.Item name="useOrgEmail" valuePropName="checked">
          <Checkbox onChange={handleUseOrgEmailChange}>Use your organization contact email for this account.</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Create Account <RightOutlined />
          </Button>
        </Form.Item>
      </S.AccountSetupForm>
    </S.Wrapper>
  )
}

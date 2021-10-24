import { Form, FormProps, Input, Button, Typography, Divider, Space } from 'antd'
import { FirebaseAuthProvider, googleProvider } from 'lib/firebaseClient'
import Link from 'next/link'
import { GoogleOutlined } from '@ant-design/icons'

import * as S from './styles'

interface Props extends FormProps {
  onSubmit: (values: unknown) => void
  onSubmitWithProvider: (provider: FirebaseAuthProvider) => void
}

export default function SignupForm({ onSubmit, onSubmitWithProvider, ...rest }: Props) {
  return (
    <S.Wrapper>
      <S.SignupForm name="signup" layout="vertical" onFinish={onSubmit} {...rest}>
        <Form.Item
          label="Email"
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
          <Input type="email" placeholder="Your email" />
        </Form.Item>

        <Space direction="vertical" size="large">
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message: 'Password is required!',
              },
              {
                pattern: new RegExp('^(?=.*[@#$%^&+=])(?=\\S+$).{8,}$'),
                message: 'Please input a valid pasword!',
              },
            ]}
            help="Must be at least 8 characters, and contain at least 1 special character."
          >
            <Input.Password placeholder="Your password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Get started
            </Button>
          </Form.Item>
        </Space>
      </S.SignupForm>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Divider>
          <Typography.Text strong>OR</Typography.Text>
        </Divider>
        <Button onClick={() => onSubmitWithProvider(googleProvider)} type="default" block>
          <GoogleOutlined /> Sign up with Google
        </Button>
        <Typography.Text>
          <Space>
            Already have an account?
            <Link href="/login" passHref>
              <Typography.Link underline>Sign in</Typography.Link>
            </Link>
          </Space>
        </Typography.Text>
      </Space>
    </S.Wrapper>
  )
}

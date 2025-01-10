import { GoogleOutlined } from '@ant-design/icons';
import { Checkbox, Form, Input, Button, Typography, Divider, Space } from 'antd';
import Link from 'next/link';

import type { FirebaseAuthProvider } from 'lib/auth/firebaseClient';
import { googleProvider } from 'lib/auth/firebaseClient';

import * as S from './styles';

export type FormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
  onSubmitWithProvider: (provider: FirebaseAuthProvider, rememberMe: boolean) => void;
};

export function LoginForm({ onSubmit, onSubmitWithProvider }: Props) {
  const [form] = Form.useForm<FormValues>();
  const rememberMe = Form.useWatch('rememberMe', form);
  return (
    <S.Wrapper>
      <S.LoginForm form={form} name='login' layout='vertical' onFinish={onSubmit as VoidFunction}>
        <Form.Item
          label='Email'
          name='email'
          rules={[
            {
              required: true,
              message: 'Email is required!'
            },
            {
              type: 'email',
              message: 'Please input a valid email!'
            }
          ]}
        >
          <Input type='email' placeholder='Your email' />
        </Form.Item>

        <Form.Item
          label='Password'
          name='password'
          rules={[{ required: true, message: 'Please input your password!' }]}
          style={{ textAlign: 'left', marginBottom: 10 }}
        >
          <Input.Password placeholder='Your password' />
        </Form.Item>
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <Typography.Text style={{ fontSize: 12 }}>
            <Link href='/reset-password' legacyBehavior>
              <Typography.Link underline>Forgot password?</Typography.Link>
            </Link>
          </Typography.Text>
        </div>

        <Form.Item>
          <Button type='primary' htmlType='submit' block>
            Sign in
          </Button>
        </Form.Item>
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Divider>
            <Typography.Text strong>OR</Typography.Text>
          </Divider>
          <Button onClick={() => onSubmitWithProvider(googleProvider, rememberMe)} type='default' block>
            <GoogleOutlined /> Sign in with Google
          </Button>

          <Form.Item name='rememberMe' valuePropName='checked'>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Typography.Text>
            <Space>
              Don&apos;t have an account yet?
              <Link href='/signup' legacyBehavior>
                <Typography.Link underline>Sign up</Typography.Link>
              </Link>
            </Space>
          </Typography.Text>
        </Space>
      </S.LoginForm>
    </S.Wrapper>
  );
}

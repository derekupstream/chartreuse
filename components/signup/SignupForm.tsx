import { GoogleOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
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

interface Props extends FormProps {
  onSubmit: (values: FormValues) => void;
  onSubmitWithProvider: (provider: FirebaseAuthProvider, rememberMe: boolean) => void;
}

export function SignupForm({ onSubmit, onSubmitWithProvider, ...rest }: Props) {
  const [form] = Form.useForm<FormValues>();
  const rememberMe = Form.useWatch('rememberMe', form);

  return (
    <S.Wrapper>
      <S.SignupForm form={form} name='signup' layout='vertical' onFinish={onSubmit as VoidFunction} {...rest}>
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

        <Space direction='vertical' size='large'>
          <Form.Item
            label='Password'
            name='password'
            rules={[
              {
                required: true,
                message: 'Password is required!'
              }
            ]}
            help='Must be at least 8 characters, and contain at least 1 special character.'
          >
            <Input.Password placeholder='Your password' />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' block>
              Get started
            </Button>
          </Form.Item>
        </Space>
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Divider>
            <Typography.Text strong>OR</Typography.Text>
          </Divider>
          <Button onClick={() => onSubmitWithProvider(googleProvider, rememberMe)} type='default' block>
            <GoogleOutlined /> Sign up with Google
          </Button>

          <Form.Item name='rememberMe' valuePropName='checked'>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Typography.Text>
            <Space>
              Already have an account?
              <Link href='/login' legacyBehavior>
                <Typography.Link underline>Sign in</Typography.Link>
              </Link>
            </Space>
          </Typography.Text>
        </Space>
      </S.SignupForm>
    </S.Wrapper>
  );
}

import { Form, Input, Button, Typography, Space } from 'antd';
import Link from 'next/link';

import * as S from './styles';

export type FormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type Props = {
  onSubmit: (values: FormValues) => void;
};

export function ResetPasswordForm({ onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>();
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
          <Input autoFocus type='email' placeholder='Your email' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block>
            Continue
          </Button>
        </Form.Item>
        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <Typography.Text>
            <Space>
              <Link href='/login' legacyBehavior>
                <Typography.Link underline>Back to sign-in</Typography.Link>
              </Link>
            </Space>
          </Typography.Text>
        </Space>
      </S.LoginForm>
    </S.Wrapper>
  );
}

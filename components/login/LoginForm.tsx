import { GoogleOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input } from 'antd';
import { useState } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './styles';

export function LoginForm() {
  const { signInWithGoogle, signInWithPassword, resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  async function handleEmailLogin({ email, password }: { email: string; password: string }) {
    setError(null);
    setIsLoading(true);
    const err = await signInWithPassword(email, password);
    if (err) setError(err);
    setIsLoading(false);
  }

  async function handleForgotPassword() {
    const email = form.getFieldValue('email');
    if (!email) {
      setError('Enter your email address above first.');
      return;
    }
    setError(null);
    setIsLoading(true);
    const err = await resetPassword(email);
    if (err) {
      setError(err);
    } else {
      setResetSent(true);
    }
    setIsLoading(false);
  }

  return (
    <S.Wrapper>
      <S.LoginForm form={form} layout='vertical' onFinish={handleEmailLogin}>
        {error && <Alert message={error} type='error' style={{ marginBottom: 16 }} />}
        {resetSent && (
          <Alert message='Password reset email sent — check your inbox.' type='success' style={{ marginBottom: 16 }} />
        )}

        <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}>
          <Input placeholder='you@example.com' autoComplete='email' />
        </Form.Item>

        <Form.Item label='Password' name='password' rules={[{ required: true }]}>
          <Input.Password placeholder='Password' autoComplete='current-password' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block size='large' loading={isLoading}>
            Sign in
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Button type='link' onClick={handleForgotPassword} loading={isLoading}>
            Forgot password?
          </Button>
        </div>

        <Divider plain>or</Divider>

        <Button onClick={signInWithGoogle} type='default' block size='large' icon={<GoogleOutlined />}>
          Sign in with Google
        </Button>
      </S.LoginForm>
    </S.Wrapper>
  );
}

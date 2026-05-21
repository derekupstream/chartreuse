import { GoogleOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Form, Input, Typography } from 'antd';
import { useState } from 'react';

import { useAuth } from 'hooks/useAuth';

import * as S from './styles';

type Mode = 'signin' | 'signup';

export function LoginForm() {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  async function handleSubmit({ email, password, name }: { email: string; password: string; name?: string }) {
    setError(null);
    setIsLoading(true);
    if (mode === 'signup') {
      const err = await signUpWithPassword(email, password, name);
      if (err) {
        setError(err);
      } else {
        setSignupSent(true);
      }
    } else {
      const err = await signInWithPassword(email, password);
      if (err) setError(err);
    }
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

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetSent(false);
    setSignupSent(false);
  }

  return (
    <S.Wrapper>
      <S.LoginForm form={form} layout='vertical' onFinish={handleSubmit}>
        {error && <Alert message={error} type='error' style={{ marginBottom: 16 }} />}
        {resetSent && (
          <Alert message='Password reset email sent — check your inbox.' type='success' style={{ marginBottom: 16 }} />
        )}
        {signupSent && (
          <Alert
            message='Account created — check your email for a confirmation link to finish signing up.'
            type='success'
            style={{ marginBottom: 16 }}
          />
        )}

        {mode === 'signup' && (
          <Form.Item label='Your name' name='name' rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input placeholder='Your name' autoComplete='name' />
          </Form.Item>
        )}

        <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}>
          <Input placeholder='you@example.com' autoComplete='email' />
        </Form.Item>

        <Form.Item
          label='Password'
          name='password'
          rules={[
            { required: true },
            ...(mode === 'signup' ? [{ min: 8, message: 'Password must be at least 8 characters' }] : [])
          ]}
        >
          <Input.Password
            placeholder='Password'
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block size='large' loading={isLoading}>
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {mode === 'signin' ? (
            <>
              <Button type='link' onClick={handleForgotPassword} loading={isLoading} style={{ paddingRight: 8 }}>
                Forgot password?
              </Button>
              <Typography.Text type='secondary'>·</Typography.Text>
              <Button type='link' onClick={() => switchMode('signup')} style={{ paddingLeft: 8 }}>
                Create an account
              </Button>
            </>
          ) : (
            <Button type='link' onClick={() => switchMode('signin')}>
              Already have an account? Sign in
            </Button>
          )}
        </div>

        <Divider plain>or</Divider>

        <Button onClick={signInWithGoogle} type='default' block size='large' icon={<GoogleOutlined />}>
          {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        </Button>
      </S.LoginForm>
    </S.Wrapper>
  );
}

import { message } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Header } from 'components/common/Header';
import type { FormValues } from 'components/login/LoginForm';
import { LoginForm } from 'components/login/LoginForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import type { FirebaseAuthProvider } from 'lib/auth/firebaseClient';

export default function Login() {
  const { login, loginWithProvider, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // this may occur when the user is logged in already, but the cookie needed to be refreshed on the frontend
    if (firebaseUser) {
      router.push('/');
    }
  }, [firebaseUser]);

  const handleLogin = async ({ email, password, rememberMe }: FormValues) => {
    try {
      await login({ email, password }, rememberMe);
      router.push('/');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider, rememberMe: boolean) => {
    try {
      await loginWithProvider(provider, rememberMe);
      router.push('/projects');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title='Sign in' />

      <main>
        <FormPageTemplate
          title='Welcome to Chart-Reuse'
          subtitle='Sign in with your email and password, or use your Google account.'
        >
          <LoginForm
            onSubmit={handleLogin as (values: unknown) => void}
            onSubmitWithProvider={handleLoginWithProvider}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

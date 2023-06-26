import { message } from 'antd';
import { useRouter } from 'next/router';

import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import type { FormValues } from 'components/signup-form';
import SignupForm from 'components/signup-form';
import { useAuth } from 'hooks/useAuth';
import type { FirebaseAuthProvider } from 'lib/auth/firebaseClient';

export default function Signup() {
  const { signup, loginWithProvider } = useAuth();
  const router = useRouter();

  const handleSignup = async ({ email, password, rememberMe }: FormValues) => {
    try {
      await signup({ email, password }, rememberMe);
      router.push('/email-verification');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider, rememberMe: boolean) => {
    try {
      await loginWithProvider(provider, rememberMe);
      router.push('/email-verification');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title='Sign up' />

      <main>
        <FormPageTemplate
          title='Welcome to Chart Reuse'
          subtitle='First, create a user account with your email, or use your Google account.'
        >
          <SignupForm
            onSubmit={handleSignup as (values: unknown) => void}
            onSubmitWithProvider={handleLoginWithProvider}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

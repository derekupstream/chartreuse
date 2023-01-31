import { message } from 'antd';
import { useRouter } from 'next/router';

import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import SignupForm from 'components/signup-form';
import type { Credentials } from 'hooks/useAuth';
import { useAuth } from 'hooks/useAuth';
import type { FirebaseAuthProvider } from 'lib/auth/firebaseClient';

export default function Signup() {
  const { signup, loginWithProvider } = useAuth();
  const router = useRouter();

  const handleSignup = async ({ email, password }: Credentials) => {
    try {
      await signup({ email, password });
      router.push('/email-verification');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider) => {
    try {
      await loginWithProvider(provider);
      router.push('/email-verification');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title='Sign up' />

      <main>
        <FormPageTemplate title='Welcome to Chart Reuse' subtitle='First, create a user account with your email, or use your Google account.'>
          <SignupForm onSubmit={handleSignup as (values: unknown) => void} onSubmitWithProvider={handleLoginWithProvider} />
        </FormPageTemplate>
      </main>
    </>
  );
}

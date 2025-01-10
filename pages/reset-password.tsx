import { message } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Header } from 'components/common/Header';
import type { FormValues } from 'components/reset-password/ResetPasswordForm';
import { ResetPasswordForm } from 'components/reset-password/ResetPasswordForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';

export default function ResetPassword() {
  const { resetPassword, firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // this may occur when the user is logged in already, but the cookie needed to be refreshed on the frontend
    if (firebaseUser) {
      router.push('/');
    }
  }, [firebaseUser]);

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await resetPassword({ email });
      router.push('/login');
      message.success('Password reset email sent');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title='Sign in' />

      <main>
        <FormPageTemplate title='Reset your password' subtitle='Enter your email to receive a code.'>
          <ResetPasswordForm onSubmit={onSubmit as (values: unknown) => void} />
        </FormPageTemplate>
      </main>
    </>
  );
}

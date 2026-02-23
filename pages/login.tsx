import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Header } from 'components/common/Header';
import { LoginForm } from 'components/login/LoginForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';

export default function Login() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (firebaseUser) {
      router.push('/projects');
    }
  }, [firebaseUser]);

  return (
    <>
      <Header title='Sign in' />
      <main>
        <FormPageTemplate title='Welcome to Chart-Reuse' subtitle='Sign in with your Google account.'>
          <LoginForm />
        </FormPageTemplate>
      </main>
    </>
  );
}

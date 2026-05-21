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
        <FormPageTemplate
          title='Welcome to Chart-Reuse'
          subtitle='Sign in or create an account to model the cost and environmental savings of switching to reusables.'
        >
          <LoginForm />
        </FormPageTemplate>
      </main>
    </>
  );
}

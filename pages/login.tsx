import { message } from 'antd';
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

  // Non-Upstream users hitting /admin land here with ?error=access_denied
  // (see ACCESS_DENIED_REDIRECT in lib/middleware/requireUpstream.ts).
  useEffect(() => {
    if (router.isReady && router.query.error === 'access_denied') {
      message.error('Access Denied: you do not have permission to view that page.', 5);
    }
  }, [router.isReady, router.query.error]);

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

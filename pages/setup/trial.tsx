import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { useCallback } from 'react';

import { Header } from 'components/common/Header';
import type { TrialSetupFields } from 'components/setup/trial/TrialSetup';
import { TrialSetupForm } from 'components/setup/trial/TrialSetup';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { useCreateTrial } from 'lib/api';
import { getUserFromContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const { firebaseToken } = await getUserFromContext(context);
  if (!firebaseToken) {
    console.warn('Missing firebase token. Redirect from trial setup to login');
    return {
      redirect: {
        permanent: false,
        destination: '/login'
      }
    };
  }
  const { emailVerified } = nookies.get(context);
  if (!emailVerified) {
    console.warn('Redirect from trial setup to verify email');
    return {
      redirect: {
        permanent: false,
        destination: '/email-verification'
      }
    };
  }

  return { props: { emailVerified: true } };
};

export default function TrialSetup() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const { trigger, isMutating } = useCreateTrial();

  const createTrial = useCallback(
    ({ title, email, name, phone, orgName }: TrialSetupFields) => {
      if (!firebaseUser) {
        message.error('There was an error, please refresh your page and try again.');
        return;
      }
      trigger(
        {
          id: firebaseUser.uid,
          title,
          email,
          name,
          phone,
          orgName
        },
        {
          onSuccess: () => {
            router.push('/projects?view=templates');
          },
          onError: err => {
            message.error((err as Error)?.message);
          }
        }
      );
    },
    [trigger, router, firebaseUser?.uid, firebaseUser?.email]
  );

  return (
    <>
      <Header title='Start for free' />

      <main>
        <FormPageTemplate
          title='Start for free'
          subtitle='Try one project in Chart-Reuse for 30 days, risk free.  No credit card required. Upgrade at anytime!'
        >
          <TrialSetupForm onSubmit={createTrial as (values: unknown) => void} isLoading={isMutating} />
        </FormPageTemplate>
      </main>
    </>
  );
}

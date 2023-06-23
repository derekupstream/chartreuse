import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import type { OrgSetupFields } from 'components/setup/org/org-setup';
import { OrgSetupForm } from 'components/setup/org/org-setup';
import chartreuseClient from 'lib/chartreuseClient';
import { getUserFromContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const { firebaseToken, user } = await getUserFromContext(context);
  if (!firebaseToken) {
    console.log('Redirect from org setup to login');
    return {
      redirect: {
        permanent: false,
        destination: '/login'
      }
    };
  }
  if (!user) {
    console.log('Redirect from org setup to trial setup');
    return {
      redirect: {
        permanent: false,
        destination: '/trial'
      }
    };
  }

  return { props: { emailVerified: true } };
};

export default function OrgSetup() {
  const router = useRouter();

  const updateOrganization = useMutation((data: any) => {
    return chartreuseClient.updateOrganization(data);
  });

  const handleOrgSetupCreation = useCallback(
    ({ orgName, numberOfClientAccounts }: OrgSetupFields) => {
      updateOrganization.mutate(
        {
          orgName,
          numberOfClientAccounts
        },
        {
          onSuccess: () => {
            router.push('/setup/account');
          },
          onError: err => {
            message.error((err as Error)?.message);
          }
        }
      );
    },
    [updateOrganization, router]
  );

  return (
    <>
      <Header title='Organization Setup' />

      <main>
        <FormPageTemplate
          title='Setup your Organization'
          subtitle='Next, let’s setup your Organization. An Organization could be a company that has multiple customers with multiple locations, or just a single business with a single location.'
        >
          <OrgSetupForm
            onSubmit={handleOrgSetupCreation as (values: unknown) => void}
            isLoading={updateOrganization.isLoading}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

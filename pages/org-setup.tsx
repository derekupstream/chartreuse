import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import OrgSetupForm from 'components/org-setup-form';
import { useAuth } from 'hooks/useAuth';
import chartreuseClient from 'lib/chartreuseClient';

export const getServerSideProps: GetServerSideProps = async context => {
  const { emailVerified } = nookies.get(context);

  if (!emailVerified) {
    console.log('Redirect to verify email');
    return {
      redirect: {
        permanent: false,
        destination: '/email-verification'
      }
    };
  }

  return { props: { emailVerified: true } };
};

type OrgSetupFields = {
  title: string;
  name: string;
  phone: string;
  orgName: string;
  numberOfClientAccounts: string;
};

export default function OrgSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const createOrgSetup = useMutation((data: any) => {
    return chartreuseClient.createOrganization(data);
  });

  const handleOrgSetupCreation = useCallback(
    ({ title, name, phone, orgName, numberOfClientAccounts }: OrgSetupFields) => {
      createOrgSetup.mutate(
        {
          id: user?.uid,
          title,
          email: user?.email,
          name,
          phone,
          orgName,
          numberOfClientAccounts
        },
        {
          onSuccess: () => {
            router.push('/account-setup');
          },
          onError: err => {
            message.error((err as Error)?.message);
          }
        }
      );
    },
    [createOrgSetup, router, user?.uid, user?.email]
  );

  return (
    <>
      <Header title='Org Account' />

      <main>
        <FormPageTemplate
          title='Setup your Organization'
          subtitle='Next, let’s setup your Organization. An Organization could be a company that has multiple customers with multiple locations, or just a single business with a single location.'
        >
          <OrgSetupForm onSubmit={handleOrgSetupCreation as (values: unknown) => void} isLoading={createOrgSetup.isLoading} />
        </FormPageTemplate>
      </main>
    </>
  );
}

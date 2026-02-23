import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { Header } from 'components/common/Header';
import type { OrgSetupFields } from 'components/setup/org/OrgSetup';
import { OrgSetupForm } from 'components/setup/org/OrgSetup';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import chartreuseClient from 'lib/chartreuseClient';
import { getUserFromContext } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  const { authUser, user } = await getUserFromContext(context);
  if (!authUser) {
    return { redirect: { permanent: false, destination: '/login' } };
  }
  if (!user) {
    return { redirect: { permanent: false, destination: '/setup/trial' } };
  }
  return { props: {} };
};

export default function OrgSetup() {
  const router = useRouter();

  const updateOrganization = useMutation((data: any) => {
    return chartreuseClient.setupOrganization(data);
  });

  const handleOrgSetupCreation = useCallback(
    ({ orgName, numberOfClientAccounts, currency, useShrinkageRate, useMetricSystem }: OrgSetupFields) => {
      updateOrganization.mutate(
        {
          orgName,
          numberOfClientAccounts,
          currency,
          useShrinkageRate,
          useMetricSystem
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

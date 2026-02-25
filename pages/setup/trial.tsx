import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { Header } from 'components/common/Header';
import type { TrialSetupFields } from 'components/setup/trial/TrialSetup';
import { TrialSetupForm } from 'components/setup/trial/TrialSetup';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { useCreateTrial } from 'lib/api';
import { getUserFromContext } from 'lib/middleware';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  const { authUser } = await getUserFromContext(context);
  if (!authUser) {
    return { redirect: { permanent: false, destination: '/login' } };
  }

  // If user already has an account by ID, skip setup
  const existingUser = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (existingUser) {
    return { redirect: { permanent: false, destination: '/projects' } };
  }

  // Check for a seeded user with the same email (Firebase-era ID mismatch)
  if (authUser.email) {
    const userByEmail = await prisma.user.findUnique({ where: { email: authUser.email } });
    if (userByEmail) {
      await prisma.$executeRaw`UPDATE "User" SET id = ${authUser.id} WHERE id = ${userByEmail.id}`;
      return { redirect: { permanent: false, destination: '/projects' } };
    }
  }

  return { props: {} };
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
        { id: firebaseUser.uid, title, email, name, phone, orgName },
        {
          onSuccess: () => router.push('/projects?view=templates'),
          onError: err => message.error((err as Error)?.message)
        }
      );
    },
    [trigger, router, firebaseUser]
  );

  return (
    <>
      <Header title='Start for free' />
      <main>
        <FormPageTemplate
          title='Create your account'
          subtitle='Set up your organization to get started with Chart-Reuse.'
        >
          <TrialSetupForm onSubmit={createTrial as (values: unknown) => void} isLoading={isMutating} />
        </FormPageTemplate>
      </main>
    </>
  );
}

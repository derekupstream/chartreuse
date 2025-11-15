import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { InviteSignupForm } from 'components/invite-signup-setup/InviteSignupForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import MessagePage from 'layouts/MessagePageLayout';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const orgInviteCode = context.query.orgInviteCode as string;

    if (!orgInviteCode) {
      return {
        props: { error: 'Invalid Invite Code' }
      };
    }

    const org = await prisma.org.findUnique({
      where: {
        orgInviteCode: orgInviteCode
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!org) {
      return {
        props: { error: 'Invalid Invite Code' }
      };
    }

    return {
      props: serializeJSON({
        org
      })
    };
  } catch (error: any) {
    return { props: { error: error.message } };
  }
};

type InviteSignupFields = {
  name: string;
  title: string;
  phone: string;
  businessVenue: string;
};

type Props = {
  org: {
    id: string;
    name: string;
  };
  error?: string;
};

export default function InviteSignup({ org, error }: Props) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const orgInviteCode = router.query.orgInviteCode as string;

  const createInviteSignup = useMutation(
    async (data: {
      id: string;
      email: string;
      orgId: string;
      businessVenue: string;
      title?: string;
      name?: string;
      phone?: string;
    }) => {
      const response = await fetch('/api/invite-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }
      return response.json();
    }
  );

  const handleInviteSignup = useCallback(
    async ({ name, title, phone, businessVenue }: InviteSignupFields) => {
      if (!firebaseUser || !org) {
        throw new Error('No user or org authed');
      }
      createInviteSignup.mutate(
        {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          orgId: org.id,
          businessVenue,
          title,
          name,
          phone
        },
        {
          onSuccess: () => {
            router.push('/');
          },
          onError: err => {
            message.error((err as Error)?.message);
          }
        }
      );
    },
    [createInviteSignup, org?.id, router, firebaseUser?.email, firebaseUser?.uid]
  );

  if (error) {
    return <MessagePage title='Oops!' message={error} />;
  }

  if (!firebaseUser || !org) {
    return <PageLoader />;
  }

  return (
    <>
      <Header title='Setup Profile' />

      <main>
        <FormPageTemplate
          title='Setup your Profile'
          subtitle={`Setup your profile to join ${org?.name} at Chart-Reuse.`}
        >
          <InviteSignupForm
            onSubmit={handleInviteSignup as (values: unknown) => void}
            isLoading={createInviteSignup.isLoading}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

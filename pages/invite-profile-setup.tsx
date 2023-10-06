import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { InviteProfileForm } from 'components/invite-profile-setup/InviteProfileForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import MessagePage from 'layouts/MessagePageLayout';
import type { CreateProfileInput } from 'lib/chartreuseClient';
import chartreuseClient from 'lib/chartreuseClient';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const inviteId = context.query.inviteId as string;

    if (!inviteId) {
      return {
        props: { error: 'Invalid Invite' }
      };
    }

    const invite = await prisma.invite.findUnique({
      where: {
        id: inviteId
      },
      include: {
        sentBy: true,
        account: true,
        org: true
      }
    });

    if (!invite) {
      return {
        props: { error: 'Invalid Invite' }
      };
    }

    if (invite.accepted) {
      return {
        props: {
          error: 'Invite was already accepted'
        }
      };
    }

    return {
      props: {
        org: invite.org,
        account: invite.account
      }
    };
  } catch (error: any) {
    return { props: { error: error.message } };
  }
};

type InviteProfileFields = {
  name: string;
  title: string;
  phone: string;
};

type Props = {
  org: {
    id: string;
    name: string;
  };
  account: {
    id: string;
    name: string;
  };
  error?: string;
};

export default function InviteProfile({ org, account, error }: Props) {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const createInviteProfile = useMutation((data: CreateProfileInput) => {
    return chartreuseClient.createProfile(data);
  });

  const handleInviteProfileCreation = useCallback(
    async ({ name, title, phone }: InviteProfileFields) => {
      if (!firebaseUser || !org) {
        throw new Error('No user or org authed');
      }
      createInviteProfile.mutate(
        {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          orgId: org.id,
          accountId: account?.id,
          inviteId: router?.query.inviteId as string,
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
    [account?.id, createInviteProfile, org?.id, router, firebaseUser?.email, firebaseUser?.uid]
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
          subtitle={`Setup your profile to accept the invite to join ${org?.name} at Chart-Reuse.`}
        >
          <InviteProfileForm
            onSubmit={handleInviteProfileCreation as (values: unknown) => void}
            isLoading={createInviteProfile.isLoading}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

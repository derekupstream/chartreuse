import { ArrowLeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';
import { useCallback } from 'react';
import { useMutation } from 'react-query';

import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import InviteForm from 'components/invite-form';
import PageLoader from 'components/page-loader';
import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import type { InviteMemberInput } from 'lib/chartreuseClient';
import chartreuseClient from 'lib/chartreuseClient';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid
      },
      include: {
        org: {
          include: {
            accounts: true
          }
        }
      }
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/login'
        }
      };
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          user: user,
          org: user.org
        })
      )
    };
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/login'
      }
    };
  }
};

type InviteFields = {
  email: string;
  accountId: string;
};

type Props = {
  user: {
    accountId?: string;
    id: string;
    orgId: string;
  };
  org: {
    id: string;
    accounts: {
      id: string;
      name: string;
    }[];
  };
};

export default function InviteMember({ org, user }: Props) {
  const router = useRouter();

  const createInvite = useMutation((data: InviteMemberInput) => {
    return chartreuseClient.inviteMember(data);
  });

  const handleAccountSetupCreation = useCallback(
    ({ email, accountId }: InviteFields) => {
      createInvite.mutate(
        {
          email,
          accountId,
          orgId: user.orgId,
          userId: user.id
        },
        {
          onSuccess: () => {
            message.success('Account member invited.');

            router.push('/members');
          },
          onError: err => {
            message.error((err as Error)?.message);
          }
        }
      );
    },
    [createInvite, router, user.id]
  );

  if (!org) return <PageLoader />;

  const fromDashboard = !!parseInt(router.query.dashboard as string, 10);

  return (
    <>
      <Header title='Org Account' />

      <main>
        <FormPageTemplate
          title='Add a new member to an account'
          subtitle='Select the account to add a new member, and send them an invite to create a profile.'
          navBackLink={
            fromDashboard ? (
              <Link href='/'>
                <ArrowLeftOutlined /> back to dashboard
              </Link>
            ) : undefined
          }
        >
          <InviteForm onSubmit={handleAccountSetupCreation as (values: unknown) => void} isLoading={createInvite.isLoading} accounts={org.accounts} isOrgAdmin={!user.accountId} />
        </FormPageTemplate>
      </main>
    </>
  );
}

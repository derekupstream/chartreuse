import { ArrowLeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';

import AccountSetupForm from 'components/account-setup-form';
import FormPageTemplate from 'components/form-page-template';
import Header from 'components/header';
import PageLoader from 'components/page-loader';
import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import type { AccountSetupFields } from 'lib/chartreuseClient';
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
        org: true
      }
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/org-setup'
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

type Props = {
  user: {
    id: string;
  };
  org: {
    id: string;
  };
};

export default function AccountSetup({ org, user }: Props) {
  const router = useRouter();
  const fromDashboard = !!parseInt(router.query.dashboard as string, 10);

  function handleAccountSetupCreation(params: AccountSetupFields) {
    chartreuseClient
      .createAccount(params)
      .then(({ invitedUser }) => {
        if (invitedUser) {
          message.success('Account contact invited.');
          router.push('/accounts');
        } else if (fromDashboard) {
          router.push('/projects');
        } else {
          // send user to first step of the calculator
          router.push('/projects/new');
        }
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title='Org Account' />

      <main>
        <FormPageTemplate
          title='Set up an account'
          subtitle='Create an account for any of your clients. Don’t have client accounts? You can use your organization information for the account section.'
          navBackLink={
            fromDashboard ? (
              <Link href='/'>
                <ArrowLeftOutlined /> back to dashboard
              </Link>
            ) : undefined
          }
        >
          <AccountSetupForm onSubmit={handleAccountSetupCreation as (values: unknown) => void} />
        </FormPageTemplate>
      </main>
    </>
  );
}

import { ArrowLeftOutlined } from '@ant-design/icons';
import { message, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import AccountSetupForm from 'components/setup/account/AccountSetup';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import type { AccountSetupFields } from 'lib/chartreuseClient';
import chartreuseClient from 'lib/chartreuseClient';
import { readSelectedTemplateCookie } from 'lib/cookies';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const { authUser } = await getUserFromContext(context);
    if (!authUser) {
      return { redirect: { permanent: false, destination: '/login' } };
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { org: true }
    });

    if (!user) {
      return { redirect: { permanent: false, destination: '/setup/trial' } };
    }

    return { props: serializeJSON({ user, org: user.org }) };
  } catch (error: any) {
    return { redirect: { permanent: false, destination: '/login' } };
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
    const sharedTemplate = readSelectedTemplateCookie();
    chartreuseClient
      .createAccount(params)
      .then(({ invitedUser }) => {
        if (invitedUser) {
          message.success('Account contact invited.');
          router.push('/accounts');
        } else if (fromDashboard) {
          router.push('/projects');
        } else if (sharedTemplate) {
          router.push(`/projects/select-template?project=${sharedTemplate.projectId}`);
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
      <Header title='Account Setup' />

      <main>
        <FormPageTemplate
          title='Set up an account'
          subtitle='Create an account for any of your clients. Don’t have client accounts? You can use your organization information for the account section.'
          navBackLink={
            fromDashboard ? (
              <Link href='/accounts' passHref legacyBehavior>
                <Typography.Link>
                  <ArrowLeftOutlined /> back to dashboard
                </Typography.Link>
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

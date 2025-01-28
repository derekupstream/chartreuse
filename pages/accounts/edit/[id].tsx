import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Account } from '@prisma/client';
import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { AccountEditForm } from 'components/accounts/edit';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import chartreuseClient from 'lib/chartreuseClient';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const { id } = context.query;

    if (!id) {
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid
      },
      include: {
        org: {
          include: {
            accounts: {
              where: {
                id: id as string
              },
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }

    return {
      props: serializeJSON({
        org: user.org
      })
    };
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/'
      }
    };
  }
};

type Props = {
  org: {
    id: string;
    accounts: Account[];
  };
};

export default function EditAccount({ org }: Props) {
  const router = useRouter();

  const redirect = typeof router.query.redirect === 'string' ? router.query.redirect : '/accounts';

  function updateAccount(data: any) {
    chartreuseClient
      .updateAccount({
        id: router.query.id,
        ...data
      })
      .then(() => {
        message.success('Account edited with success.');
        router.push(redirect);
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  if (!org) return <PageLoader />;

  const accountName = org.accounts.find(account => account.id === router.query.id)?.name;

  return (
    <>
      <Header title='Edit Account' />

      <main>
        <FormPageTemplate
          title='Edit account'
          navBackLink={
            <Link href='/'>
              <ArrowLeftOutlined /> back to dashboard
            </Link>
          }
        >
          <AccountEditForm
            onSubmit={updateAccount}
            onCancel={() => router.push('/accounts')}
            initialValues={{ name: accountName }}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

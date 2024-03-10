import { ArrowLeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import nookies from 'nookies';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { MemberEditForm } from 'components/edit-member-profile/MemberEditForm';
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

    const admin = await prisma.user.findUnique({
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

    const user = await prisma.user.findUnique({
      where: {
        id: id as string
      },
      include: {
        account: true
      }
    });

    if (!admin || !user) {
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }

    return {
      props: serializeJSON({
        user: user,
        org: admin.org
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

type MemberEditFields = {
  name: string;
  email: string;
  title: string;
  phone: string;
  accountId: string;
};

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    title: string;
    phone: string;
    account: {
      id: string;
    };
  };
  org: {
    id: string;
    accounts: {
      id: string;
      name: string;
    }[];
  };
};

export default function EditMemberProfile({ org, user }: Props) {
  const router = useRouter();

  function handleAccountUpdate(data: MemberEditFields) {
    chartreuseClient
      .updateProfile({
        id: user.id,
        ...data
      })
      .then(() => {
        message.success('Member edited with success.');

        router.push('/members');
      })
      .catch(err => {
        message.error((err as Error)?.message);
      });
  }

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title='Edit Account Member' />

      <main>
        <FormPageTemplate
          title='Edit account member'
          navBackLink={
            <Link href='/'>
              <ArrowLeftOutlined /> back to dashboard
            </Link>
          }
        >
          <MemberEditForm
            onSubmit={handleAccountUpdate}
            onCancel={() => router.push('/')}
            initialValues={{
              name: user.name,
              email: user.email,
              title: user.title,
              phone: user.phone,
              accountId: user.account?.id
            }}
            accounts={org.accounts}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}

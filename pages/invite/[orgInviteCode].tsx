import { GoogleOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import MessagePage from 'layouts/MessagePageLayout';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const orgInviteCode = context.params?.orgInviteCode as string;

    if (!orgInviteCode) {
      return { props: { org: null, error: 'Invalid Invite Code' } };
    }

    const org = await prisma.org.findUnique({
      where: { orgInviteCode },
      select: { id: true, name: true }
    });

    if (!org) {
      return { props: { org: null, error: 'Invalid Invite Code' } };
    }

    return { props: serializeJSON({ org }) };
  } catch (error: any) {
    return { props: { org: null, error: error.message } };
  }
};

type Props = {
  org?: { id: string; name: string };
  error?: string;
};

export default function Invite({ org, error }: Props) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const orgInviteCode = router.query.orgInviteCode as string;

  const handleSignInWithGoogle = async () => {
    try {
      if (orgInviteCode) {
        sessionStorage.setItem('pendingOrgInviteCode', orgInviteCode);
      }
      await signInWithGoogle();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  if (error) {
    return <MessagePage title='Oops!' message={error} />;
  }

  if (!org) {
    return <PageLoader />;
  }

  return (
    <>
      <Header title='Join Organization' />
      <main>
        <FormPageTemplate
          title={`Join ${org.name} on Chart-Reuse`}
          subtitle={`When you create your account, you'll automatically be added to the ${org.name} Chart-Reuse workspace. Let's get started.`}
        >
          <Button onClick={handleSignInWithGoogle} type='default' block size='large' icon={<GoogleOutlined />}>
            Join with Google
          </Button>
        </FormPageTemplate>
      </main>
    </>
  );
}

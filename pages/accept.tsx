import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { GoogleOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import MessagePage from 'layouts/MessagePageLayout';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const inviteId = context.query.inviteId as string;

    if (!inviteId) {
      return { props: { user: null, org: null, email: null, error: 'Invalid Invite' } };
    }

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: { sentBy: true, org: true }
    });

    if (!invite) {
      return { props: { user: null, org: null, email: null, error: 'Invalid Invite' } };
    }

    if (invite.accepted) {
      return { props: { user: null, org: null, email: null, error: 'Invite was already accepted' } };
    }

    return { props: serializeJSON({ user: invite.sentBy, org: invite.org, email: invite.email }) };
  } catch (error: any) {
    return { props: { user: null, org: null, error: error.message } };
  }
};

type Props = {
  user?: { name: string; title: string };
  org?: { name: string };
  email?: string;
  error?: string;
};

export default function Accept({ user, org, error }: Props) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSignInWithGoogle = async () => {
    try {
      // Store inviteId so the callback can redirect properly
      if (router.query.inviteId) {
        sessionStorage.setItem('pendingInviteId', router.query.inviteId as string);
      }
      await signInWithGoogle();
    } catch (err: any) {
      message.error(err.message);
    }
  };

  if (error) {
    return <MessagePage title='Oops!' message={error} />;
  }

  if (!user || !org) {
    return <PageLoader />;
  }

  return (
    <>
      <Header title='Accept Invite' />
      <main>
        <FormPageTemplate
          title={`Join ${org.name} on Chart-Reuse`}
          subtitle={`${user?.name.trim()}${user?.title ? `, ${user.title.trim()}` : ''} from ${org?.name.trim()} has invited you to create a customer account on Chart-Reuse.`}
        >
          <Button onClick={handleSignInWithGoogle} type='default' block size='large' icon={<GoogleOutlined />}>
            Accept with Google
          </Button>
        </FormPageTemplate>
      </main>
    </>
  );
}

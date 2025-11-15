import { message } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import type { FormValues } from 'components/signup/SignupForm';
import { SignupForm } from 'components/signup/SignupForm';
import { useAuth } from 'hooks/useAuth';
import { FormPageTemplate } from 'layouts/FormPageLayout';
import MessagePage from 'layouts/MessagePageLayout';
import type { FirebaseAuthProvider } from 'lib/auth/firebaseClient';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const orgInviteCode = context.params?.orgInviteCode as string;

    if (!orgInviteCode) {
      return {
        props: { org: null, error: 'Invalid Invite Code' }
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
        props: { org: null, error: 'Invalid Invite Code' }
      };
    }

    return {
      props: serializeJSON({
        org
      })
    };
  } catch (error: any) {
    return { props: { org: null, error: error.message } };
  }
};

type Props = {
  org?: {
    id: string;
    name: string;
  };
  error?: string;
};

export default function Invite({ org, error }: Props) {
  const { signup, loginWithProvider } = useAuth();
  const router = useRouter();
  const orgInviteCode = router.query.orgInviteCode as string;

  const handleSignup = async ({ email, password, rememberMe }: FormValues) => {
    try {
      await signup({ email, password }, rememberMe);
      router.push(`/invite-signup-setup?orgInviteCode=${orgInviteCode}`);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider, rememberMe: boolean) => {
    try {
      await loginWithProvider(provider, rememberMe);
      router.push(`/invite-signup-setup?orgInviteCode=${orgInviteCode}`);
    } catch (error: any) {
      message.error(error.message);
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
          <SignupForm onSubmit={handleSignup} onSubmitWithProvider={handleLoginWithProvider} />
        </FormPageTemplate>
      </main>
    </>
  );
}

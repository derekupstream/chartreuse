import { message } from 'antd';
import { sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/router';
import { destroyCookie, setCookie } from 'nookies';
import { useEffect } from 'react';

import { Header } from 'components/common/Header';
import { PageLoader } from 'components/common/PageLoader';
import { useAuth } from 'hooks/useAuth';
import MessagePage from 'layouts/MessagePageLayout';

export default function EmailVerification() {
  const { firebaseUser } = useAuth();
  const router = useRouter();

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';

  useEffect(() => {
    let interval: NodeJS.Timer | undefined;

    const verifyEmail = async () => {
      destroyCookie(null, 'emailVerified');

      if (firebaseUser?.emailVerified) {
        console.log('Email verified! send user to /setup');
        setCookie(null, 'emailVerified', 'true', { expires: 0 });
        router.push('/setup');
      } else {
        try {
          console.log('Sending email verification email', { email: firebaseUser?.email });
          if (firebaseUser) {
            await sendEmailVerification(firebaseUser, {
              url: `${origin}/setup`
            });
            interval = setInterval(async () => {
              if (firebaseUser.emailVerified) {
                console.log('Email verified! send user to /setup');
                setCookie(null, 'emailVerified', 'true', { expires: 0 });
                clearInterval(interval);
                router.push('/setup');
              }
              await firebaseUser.reload();
            }, 2000);
          }
          //setCookie(null, 'emailVerified', 'true', { expires: 0 });
        } catch (error: any) {
          message.error(error.message);
        }
      }
      return () => {
        clearInterval(interval);
      };
    };
    if (firebaseUser) {
      verifyEmail();
    }
  }, [origin, router, firebaseUser]);

  if (!firebaseUser) return <PageLoader />;

  return (
    <>
      <Header title='Email verification' />

      <main>
        <MessagePage
          title='Got it!'
          message='Check your email for a link to continue setting up your
            organization.'
        />
      </main>
    </>
  );
}

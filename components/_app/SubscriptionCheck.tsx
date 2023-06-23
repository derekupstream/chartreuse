import type { NextRouter } from 'next/router';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { useSubscription } from 'hooks/useSubscription';
import type { SubscriptionStatus } from 'lib/stripe/getCustomerSubscription';

export function SubscriptionCheck({ children }: { children: any }) {
  const router = useRouter();
  const { subscriptionStatus } = useSubscription();

  // Redirect users to subscription page if it is expired
  function checkSubscription(_router: NextRouter, pathname: string, subscriptionStatus?: SubscriptionStatus) {
    if (!subscriptionStatus) {
      return;
    }
    const isExpired = subscriptionStatus === 'Expired_Trial' || subscriptionStatus === 'Canceled';
    if (pathname !== '/subscription' && isExpired) {
      console.log('Redirect user to subscription page');
      _router.push('/subscription');
    }
  }

  useEffect(() => {
    function handleRouteChange(url: string) {
      checkSubscription(router, url, subscriptionStatus);
    }
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.pathname, subscriptionStatus]);

  useEffect(() => {
    checkSubscription(router, router.pathname, subscriptionStatus);
  }, [subscriptionStatus]);

  return children;
}

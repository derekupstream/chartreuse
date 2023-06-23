import type { GetServerSideProps } from 'next';

import Subscription from 'components/dashboard/subscription';
import { ComingSoon } from 'components/dashboard/subscription/comingSoon';
import { useSubscription } from 'hooks/useSubscription';
import BaseLayout from 'layouts/baseLayout';
import Template from 'layouts/dashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const SubscriptionPage = ({ user }: PageProps) => {
  const { subscriptionStatus, isLoading } = useSubscription();
  if (subscriptionStatus === 'Active') {
    return (
      <Template user={user} selectedMenuItem='subscription' title='Subscription'>
        <Subscription />
      </Template>
    );
  } else if (subscriptionStatus || isLoading === false) {
    return (
      <BaseLayout user={user} selectedMenuItem='subscription' title='Subscription'>
        <ComingSoon subscriptionStatus={subscriptionStatus || 'no_subscription'} />
      </BaseLayout>
    );
  }
  return null;
};

export default SubscriptionPage;

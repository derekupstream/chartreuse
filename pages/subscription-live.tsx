import type { GetServerSideProps } from 'next';

import Subscription from 'components/dashboard/subscription';
import Template from 'layouts/dashboardLayout';
import { checkLogin } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const SubscriptionPage = () => {
  return <Subscription />;
};

SubscriptionPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='subscription' title='Subscription'>
      {page}
    </Template>
  );
};

export default SubscriptionPage;

import type { GetServerSideProps } from 'next';

import Subscription from 'components/subscription';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
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

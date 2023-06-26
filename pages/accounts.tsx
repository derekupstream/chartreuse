import type { GetServerSideProps } from 'next';

import Accounts from 'components/accounts';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import type { LoggedinProps } from 'lib/middleware';
import { checkLogin } from 'lib/middleware';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const AccountsPage = ({ user }: LoggedinProps) => {
  return <Accounts user={user} />;
};

AccountsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='accounts' title='Accounts'>
      {page}
    </Template>
  );
};

export default AccountsPage;

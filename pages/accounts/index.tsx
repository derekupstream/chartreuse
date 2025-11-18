import type { GetServerSideProps } from 'next';

import { AccountsPage } from 'components/accounts/AccountsPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import type { LoggedinProps } from 'lib/middleware';
import { checkLogin } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  if (response.props.user?.orgId) {
    const org = await prisma.org.findUnique({
      where: { id: response.props.user.orgId },
      select: { orgInviteCode: true }
    });

    return {
      props: serializeJSON({
        user: response.props.user,
        org: { orgInviteCode: org?.orgInviteCode || null }
      })
    };
  }
  return response;
};

const Accounts = ({ user, org }: LoggedinProps & { org: { orgInviteCode: string | null } }) => {
  return <AccountsPage user={user} org={org} />;
};

Accounts.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='accounts' title='Accounts'>
      {page}
    </Template>
  );
};

export default Accounts;

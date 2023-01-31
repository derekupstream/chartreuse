import type { GetServerSideProps } from 'next';

import type { PageProps as MembersProps } from 'components/dashboard/members';
import Members from 'components/dashboard/members';
import Template from 'layouts/dashboardLayout';
import { checkLogin } from 'lib/middleware';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

// @ts-ignore TODO: rewrite checkLogin()
export const getServerSideProps: GetServerSideProps<MembersProps> = async context => {
  const response = await checkLogin(context);
  if (response.props.user?.orgId) {
    const users = await prisma.user.findMany({
      where: {
        orgId: response.props.user.orgId,
        accountId: response.props.user.accountId || undefined
      }
    });
    const invites = await prisma.invite.findMany({
      where: {
        orgId: response.props.user.orgId,
        accountId: response.props.user.accountId || undefined,
        accepted: false
      }
    });
    return {
      props: {
        user: response.props.user,
        accounts: response.props.user.org.accounts,
        users,
        invites
      }
    };
  } else {
    return response;
  }
};

const MembersPage = (props: MembersProps) => {
  return <Members {...props} />;
};

MembersPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='members' title='Members'>
      {page}
    </Template>
  );
};

export default MembersPage;

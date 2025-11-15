import type { GetServerSideProps } from 'next';

import type { PageProps as MembersProps } from 'components/members/MembersPage';
import { MembersPage } from 'components/members/MembersPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
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
    const org = await prisma.org.findUnique({
      where: { id: response.props.user.orgId },
      select: { orgInviteCode: true }
    });

    return {
      props: serializeJSON({
        user: response.props.user,
        accounts: response.props.user.org.accounts,
        users,
        invites,
        org: { orgInviteCode: org?.orgInviteCode || null }
      })
    };
  } else {
    return response;
  }
};

const Members = (props: MembersProps) => {
  return <MembersPage {...props} />;
};

Members.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='members' title='Members'>
      {page}
    </Template>
  );
};

export default Members;

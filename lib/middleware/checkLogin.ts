import type { GetServerSidePropsContext } from 'next';

import type { DashboardUser } from 'interfaces';
import { serializeJSON } from 'lib/objects';

import { UserDataToInclude } from './getProjectContext';
import { getUserFromContext } from './getUserFromContext';

export type LoggedinProps = {
  user: DashboardUser;
};

export const checkLogin = async (
  context: GetServerSidePropsContext
): Promise<{ redirect?: any; props: { user?: DashboardUser } }> => {
  try {
    const { authUser, user } = await getUserFromContext(context, UserDataToInclude);

    if (!user) {
      if (authUser) {
        console.log('Supabase user found but no DB user. Redirect to /setup', { email: authUser.email });
        return { props: {}, redirect: { permanent: false, destination: '/setup/trial' } };
      }
      console.log('No user found. Redirect to login');
      return { props: {}, redirect: { permanent: false, destination: '/login' } };
    }

    if (typeof user.accountId === 'string') {
      // @ts-ignore
      user.org.accounts = user.org.accounts.filter(account => account.id === user.accountId);
    }

    return { props: serializeJSON({ user }) };
  } catch (error: any) {
    console.error('Error checking user auth. Redirect to login', error);
    return { props: {}, redirect: { permanent: false, destination: '/login' } };
  }
};

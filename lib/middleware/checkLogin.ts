import { GetServerSidePropsContext } from 'next'
import type { DashboardUser } from 'components/dashboard'

import { UserDataToInclude } from './getProjectContext'
import { getUserFromContext } from './getUserFromContext'

export type LoggedinProps = {
  user: DashboardUser
}

export const checkLogin = async (context: GetServerSidePropsContext): Promise<{ redirect?: any; props: { user?: DashboardUser } }> => {
  try {
    const user = await getUserFromContext(context, UserDataToInclude)

    if (!user) {
      console.log('No user found. Redirect to login')
      return {
        props: {},
        redirect: {
          permanent: false,
          destination: '/login',
        },
      }
    }

    // only provide access to accounts this user has access to
    if (typeof user.accountId === 'string') {
      user.org.accounts = user.org.accounts.filter(account => account.id === user.accountId)
    }

    return {
      props: {
        user,
      },
    }
  } catch (error: any) {
    console.error('Error checking user auth. Redirect to login', error)
    return {
      props: {},
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

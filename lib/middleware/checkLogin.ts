import nookies from 'nookies'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import { GetServerSidePropsContext } from 'next'
import { DashboardUser } from 'components/dashboard'

import { UserDataToInclude } from './getProjectContext'

export type LoggedinProps = {
  user: DashboardUser
}

export const checkLogin = async (context: GetServerSidePropsContext): Promise<{ redirect?: any; props: { user?: DashboardUser } }> => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: UserDataToInclude,
    })

    if (!user) {
      return {
        props: {},
        redirect: {
          permanent: false,
          destination: '/org-setup',
        },
      }
    }

    // only provide access to accounts this user has access to
    if (user.accountId !== null) {
      user.org.accounts = user.org.accounts.filter(account => account.id === user.accountId)
    }

    return {
      props: {
        user,
      },
    }
  } catch (error: any) {
    console.error('Error checking user auth', error)
    return {
      props: {},
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

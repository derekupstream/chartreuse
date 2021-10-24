import nookies from 'nookies'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import { verifyIdToken } from 'lib/firebaseAdmin'
import { GetServerSidePropsContext } from 'next'

export const UserDataToInclude = {
  org: {
    include: {
      accounts: {
        include: {
          invites: {
            include: {
              account: true,
            },
          },
          users: {
            include: {
              account: true,
            },
          },
        },
      },
    },
  },
}

export const checkLogin = async (context: GetServerSidePropsContext) => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
      where: {
        id: token.uid,
      },
      include: UserDataToInclude,
    })

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/org-setup',
        },
      }
    }

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    }
  } catch (error: any) {
    console.error('Error checking user auth', error)
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

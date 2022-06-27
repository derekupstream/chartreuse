import nookies from 'nookies'
import prisma from 'lib/prisma'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import { GetServerSidePropsContext } from 'next'

import { UserDataToInclude } from './getProjectContext'

export async function getUserFromContext<T = Partial<typeof UserDataToInclude>>(context: GetServerSidePropsContext, dataToInclude: T = {} as T) {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: dataToInclude,
    })

    return { user, firebaseToken: token }
  } catch (error) {
    console.error('Error retrieving user from cookie:', error)
    return {}
  }
}

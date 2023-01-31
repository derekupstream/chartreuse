import { Prisma, User } from '@prisma/client'
import prisma from 'lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'

export type NextApiRequestWithUser = NextApiRequest & {
  user: User
}

export async function getUser(req: NextApiRequestWithUser, res: NextApiResponse, next: Function) {
  const cookies = req.cookies
  if (!cookies.token) {
    throw new Error('Request requires authentication')
  }
  const token = await verifyIdToken(cookies.token as string)
  const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
    where: {
      id: token.uid,
    },
  })
  if (!user) {
    res.status(401).send('User not found')
  } else {
    req.user = user
    next()
  }
}

export default getUser

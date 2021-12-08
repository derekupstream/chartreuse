import { Prisma, User } from '@prisma/client'
import prisma from 'lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'

export type NextApiRequestWithUser = NextApiRequest & {
  user: User
}

export default async function getUser(req: NextApiRequestWithUser, res: NextApiResponse, next: Function) {
  const cookies = req.cookies
  const token = await verifyIdToken(cookies.token)
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

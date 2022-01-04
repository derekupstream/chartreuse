import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'
import nc from 'next-connect'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).patch(updateAccount).delete(deleteAccount)

async function updateAccount (req: NextApiRequestWithUser, res: NextApiResponse) {

  const account = await prisma.account.update<Prisma.AccountUpdateArgs>({
    where: {
      id: req.query.id as string,
    },
    data: {
      name: req.body.name,
    },
  })

  return res.status(200).json({ account })
}

async function deleteAccount (req: NextApiRequestWithUser, res: NextApiResponse) {

  await prisma.account.deleteMany({
    where: {
      id: req.query.id as string,
      orgId: req.user.orgId,
    },
  })

  return res.status(200)
}

export default handler

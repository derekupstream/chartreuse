import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { Invite } from '@prisma/client'
import nc from 'next-connect'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).delete(deleteInvite)

type Response = {
  invite?: Invite
  error?: string
}

async function deleteInvite(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const invite = await prisma.invite.delete({
    where: {
      id: req.query.id as string,
    },
  })

  return res.status(200).json({ invite })
}

export default handler

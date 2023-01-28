import type { NextApiResponse } from 'next'
import { projectHandler, NextApiRequestWithUser } from 'lib/middleware'
import prisma from 'lib/prisma'

const handler = projectHandler()

handler.delete(deleteEndpoint)

async function deleteEndpoint(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id as string

  await prisma.singleUseLineItemRecord.deleteMany({
    where: {
      singleUseLineItem: {
        projectId,
      },
    },
  })

  res.status(200).end()
}

export default handler

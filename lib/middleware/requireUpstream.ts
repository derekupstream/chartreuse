import prisma from 'lib/prisma'
import type { NextApiResponse } from 'next'
import { NextApiRequestWithUser } from './getUser'

export async function checkIsUpstream(orgId: string) {
  return prisma.org
    .count({
      where: {
        id: orgId,
        isUpstream: true,
      },
    })
    .then(count => count > 0)
}

export async function requireUpstream(req: NextApiRequestWithUser, res: NextApiResponse, next: Function) {
  const isUpstream = await checkIsUpstream(req.user.orgId)

  if (!isUpstream) {
    res.status(401).send('Access denied')
  } else {
    console.log(`Upstream route requested: [${req.method}] ${req.url}`, {
      userId: req.user.id,
    })
    next()
  }
}

export default requireUpstream

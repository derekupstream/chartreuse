import nc from 'next-connect'
import prisma from 'lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { AllProjectsSummary, getAllProjections } from 'lib/calculator'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getProjectionsHandler)

async function getProjectionsHandler(req: NextApiRequestWithUser, res: NextApiResponse<AllProjectsSummary>) {
  const projects = await prisma.project.findMany({
    where: {
      accountId: req.user.accountId || undefined,
      orgId: req.user.orgId,
    },
    include: {
      account: true,
    },
  })

  const result = await getAllProjections(projects)

  res.json(result)
}

export default handler

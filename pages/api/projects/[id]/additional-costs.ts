import prisma from 'lib/prisma'
import { AdditionalCost, Prisma } from '@prisma/client'
import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CreateAdditionalCostValidator } from 'lib/validators'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).get(getAdditionalCosts).post(createAdditionalCost).delete(deleteAdditionalCost)

async function getAdditionalCosts(req: NextApiRequestWithUser, res: NextApiResponse<{ additionalCosts: AdditionalCost[] }>) {
  const projectId = req.query.id as string
  const additionalCosts = await prisma.additionalCost.findMany<Prisma.AdditionalCostFindManyArgs>({
    where: {
      projectId,
    },
  })
  res.status(200).json({ additionalCosts })
}

async function createAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse<{ additionalCost: AdditionalCost }>) {
  const data = {
    projectId: req.body.projectId,
    cost: req.body.cost,
    frequency: String(req.body.frequency),
    categoryId: req.body.categoryId,
  }

  CreateAdditionalCostValidator.parse(data)

  // @todo validate that project ID exists and belongs to current user
  const additionalCost = await prisma.additionalCost.create<Prisma.AdditionalCostCreateArgs>({
    data,
  })

  res.status(200).json({ additionalCost })
}

async function deleteAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  // @todo validate the project belongs to current user
  // @todo get project id from URL instead of parsing out of body
  await prisma.additionalCost.delete<Prisma.AdditionalCostDeleteArgs>({
    where: {
      id: req.body.id,
    },
  })
  res.status(200).json({})
}

export default handler

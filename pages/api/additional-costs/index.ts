import prisma from 'lib/prisma'
import { AdditionalCost, Prisma } from '@prisma/client'
import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CreateAdditionalCostValidator } from 'lib/validators'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { validateProject } from 'lib/middleware/validateProject'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getAdditionalCosts).post(createAdditionalCost).delete(deleteAdditionalCost)

async function getAdditionalCosts(req: NextApiRequestWithUser, res: NextApiResponse<{ additionalCosts: AdditionalCost[] }>) {
  const projectId = req.query.projectId as string
  const additionalCosts = await prisma.additionalCost.findMany<Prisma.AdditionalCostFindManyArgs>({
    where: {
      projectId,
    },
  })
  res.status(200).json({ additionalCosts })
}

async function createAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse<{ additionalCost: AdditionalCost }>) {
  const data: Prisma.AdditionalCostCreateArgs['data'] = {
    projectId: req.body.projectId,
    cost: req.body.cost,
    frequency: String(req.body.frequency),
    categoryId: req.body.categoryId,
    description: req.body.description,
  }

  CreateAdditionalCostValidator.parse(data)

  // @todo validate that project ID exists and belongs to current user
  const additionalCost = await prisma.additionalCost.create({
    data,
  })

  res.status(200).json({ additionalCost })
}

async function deleteAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.additionalCost.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId,
    },
  })
  res.status(200).json({})
}

export default handler

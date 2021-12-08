import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { Prisma, WasteHaulingCost } from '.prisma/client'
import prisma from 'lib/prisma'
import { validateProject } from 'lib/middleware/validateProject'
import { CreateWasteHaulingCostValidator } from 'lib/validators'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getWasteHaulingCosts).post(createWasteHaulingCost).delete(deleteWasteHaulingCost)

async function getWasteHaulingCosts(req: NextApiRequestWithUser, res: NextApiResponse<{ wasteHaulingCosts: WasteHaulingCost[] }>) {
  const projectId = req.query.projectId as string
  const wasteHaulingCosts = await prisma.wasteHaulingCost.findMany({
    where: {
      projectId,
    },
  })
  res.status(200).json({ wasteHaulingCosts })
}

async function createWasteHaulingCost(req: NextApiRequestWithUser, res: NextApiResponse<{ wasteHaulingCost: WasteHaulingCost }>) {
  const data: Prisma.WasteHaulingCostCreateArgs['data'] = {
    projectId: req.body.projectId,
    monthlyCost: req.body.monthlyCost,
    wasteStream: req.body.wasteStream,
    serviceType: req.body.serviceType,
  }

  CreateWasteHaulingCostValidator.parse(data)

  const wasteHaulingCost = await prisma.wasteHaulingCost.create({
    data,
  })

  res.status(200).json({ wasteHaulingCost })
}

async function deleteWasteHaulingCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.wasteHaulingCost.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId,
    },
  })
  res.status(200).json({})
}

import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { LaborCost, Prisma } from '.prisma/client'
import prisma from 'lib/prisma'
import { validateProject } from 'lib/middleware/validateProject'
import { CreateLaborCostValidator } from 'lib/validators'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getLaborCosts).post(createLaborCost).delete(deleteLaborCost)

async function getLaborCosts(req: NextApiRequestWithUser, res: NextApiResponse<{ laborCosts: LaborCost[] }>) {
  const projectId = req.query.projectId as string
  const laborCosts = await prisma.laborCost.findMany({
    where: {
      projectId,
    },
  })
  res.status(200).json({ laborCosts })
}

async function createLaborCost(req: NextApiRequestWithUser, res: NextApiResponse<{ laborCost: LaborCost }>) {
  const data: Prisma.LaborCostCreateArgs['data'] = {
    projectId: req.body.projectId,
    cost: req.body.cost,
    categoryId: req.body.categoryId,
    description: req.body.description,
    frequency: req.body.frequency,
  }

  CreateLaborCostValidator.parse(data)

  let laborCost: LaborCost

  if (req.body.id) {
    laborCost = await prisma.laborCost.update({
      where: {
        id: req.body.id,
      },
      data: req.body,
    })
  } else {
    laborCost = await prisma.laborCost.create({
      data,
    })
  }

  res.status(200).json({ laborCost })
}

async function deleteLaborCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.laborCost.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId,
    },
  })
  res.status(200).json({})
}

export default handler

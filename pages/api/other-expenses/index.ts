import prisma from 'lib/prisma'
import { OtherExpense, Prisma } from '@prisma/client'
import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CreateOtherExpenseValidator } from 'lib/validators'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { validateProject } from 'lib/middleware/validateProject'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getAdditionalCosts).post(createAdditionalCost).delete(deleteAdditionalCost)

async function getAdditionalCosts(req: NextApiRequestWithUser, res: NextApiResponse<{ otherExpenses: OtherExpense[] }>) {
  const projectId = req.query.projectId as string
  const otherExpenses = await prisma.otherExpense.findMany<Prisma.OtherExpenseFindManyArgs>({
    where: {
      projectId,
    },
  })
  res.status(200).json({ otherExpenses })
}

async function createAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse<{ additionalCost: OtherExpense }>) {
  const data: Prisma.OtherExpenseCreateArgs['data'] = {
    projectId: req.body.projectId,
    cost: req.body.cost,
    frequency: String(req.body.frequency),
    categoryId: req.body.categoryId,
    description: req.body.description,
  }

  CreateOtherExpenseValidator.parse(data)

  let additionalCost: OtherExpense

  if (req.body.id) {
    additionalCost = await prisma.otherExpense.update({
      where: {
        id: req.body.id,
      },
      data: req.body,
    })
  } else {
    additionalCost = await prisma.otherExpense.create({
      data: req.body,
    })
  }

  res.status(200).json({ additionalCost })
}

async function deleteAdditionalCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.otherExpense.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId,
    },
  })
  res.status(200).json({})
}

export default handler

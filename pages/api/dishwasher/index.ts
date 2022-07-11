import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { Dishwasher as PrismaDishwasher, Prisma } from '.prisma/client'
import prisma from 'lib/prisma'
import { validateProject } from 'lib/middleware/validateProject'
import { DishWasherValidator } from 'lib/validators'
import { DishwasherStats, getDishwasherStats } from 'lib/calculator/outputs/dishwasher'
import { getUtilitiesByState, UtilityRates, USState } from 'lib/calculator/constants/utilities'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getDishwasher).post(createDishwasher).delete(deleteDishwasher)

export interface Response {
  accountId: string
  dishwasher: PrismaDishwasher
  stats: DishwasherStats
  state: string
  rates: UtilityRates
}

async function getDishwasher(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const projectId = req.query.projectId as string
  const dishwasher = await prisma.dishwasher.findFirst({
    where: {
      projectId,
    },
    include: {
      project: {
        include: {
          account: true,
        },
      },
    },
  })

  if (dishwasher) {
    const state = dishwasher.project.account.USState as USState
    const stats = getDishwasherStats({ dishwasher, state })
    const rates = getUtilitiesByState(state)
    const accountId = dishwasher.project.account.id
    res.status(200).json({ accountId, dishwasher, state, stats, rates })
  } else {
    res.status(200).end()
  }
}

async function createDishwasher(req: NextApiRequestWithUser, res: NextApiResponse<{ dishwasher?: PrismaDishwasher; error?: string }>) {
  const data: Prisma.DishwasherCreateArgs['data'] = {
    additionalRacksPerDay: req.body.additionalRacksPerDay,
    boosterWaterHeaterFuelType: req.body.boosterWaterHeaterFuelType ?? '',
    buildingWaterHeaterFuelType: req.body.buildingWaterHeaterFuelType,
    energyStarCertified: req.body.energyStarCertified,
    operatingDays: req.body.operatingDays,
    projectId: req.body.projectId,
    temperature: req.body.temperature,
    type: req.body.type,
  }
  DishWasherValidator.parse(data)

  let dishwasher: PrismaDishwasher | undefined

  if (req.body.id) {
    dishwasher = await prisma.dishwasher.update({
      where: {
        id: req.body.id,
      },
      data: req.body,
    })
  } else {
    dishwasher = await prisma.dishwasher.create({
      data,
    })
  }
  res.status(200).json({ dishwasher })
}

async function deleteDishwasher(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.dishwasher.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId,
    },
  })
  res.status(200).json({})
}

export default handler

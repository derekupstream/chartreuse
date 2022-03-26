import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { Dishwasher as PrismaDishwasher, Prisma } from '.prisma/client'
import prisma from 'lib/prisma'
import { validateProject } from 'lib/middleware/validateProject'
import { DishWasherValidator } from 'lib/validators'
import { dishwasherUtilityUsage, dishwasherAnnualCostBreakdown } from 'lib/calculator/outputs/financial-results'
import { DishWasher } from 'lib/calculator/types/projects'
import { getUtilityGasEmissions } from 'lib/calculator/outputs/environmental-results'
import { getUtilitiesByState, UtilityRates, USState } from 'lib/calculator/constants/utilities'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).use(validateProject).get(getDishwasher).post(createDishwasher).delete(deleteDishwasher)

type DishwasherStats = {
  electricUsage: number
  electricCO2Weight: number
  electricCost: number
  gasUsage: number
  gasCO2Weight: number
  gasCost: number
  waterUsage: number
  waterCost: number
}

async function getDishwasher(req: NextApiRequestWithUser, res: NextApiResponse<{ accountId?: string; dishwasher?: PrismaDishwasher; state?: string; rates?: UtilityRates; stats?: DishwasherStats }>) {
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
    const rates = getUtilitiesByState(state)
    const usage = dishwasherUtilityUsage(dishwasher as DishWasher)
    const costs = dishwasherAnnualCostBreakdown(dishwasher as DishWasher, rates)
    const emissions = getUtilityGasEmissions(dishwasher as DishWasher)
    const stats: DishwasherStats = {
      electricUsage: usage.electricUsage,
      electricCO2Weight: emissions.electric,
      electricCost: costs.electric,
      gasUsage: usage.gasUsage,
      gasCO2Weight: emissions.gas,
      gasCost: costs.gas,
      waterUsage: usage.waterUsage,
      waterCost: costs.water,
    }
    const accountId = dishwasher.project.account.id
    res.status(200).json({ accountId, dishwasher, state, stats, rates })
  } else {
    res.status(200).json({})
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

  const existing = await prisma.dishwasher.findFirst({
    where: {
      projectId: data.projectId,
    },
  })
  if (existing) {
    res.status(400).send({ error: 'Dishwasher already exists' })
  } else {
    const dishwasher = await prisma.dishwasher.create({
      data,
    })
    res.status(200).json({ dishwasher })
  }
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

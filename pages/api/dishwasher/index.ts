import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser, NextApiRequestWithUser } from 'lib/middleware'
import { Dishwasher as PrismaDishwasher, Prisma } from '.prisma/client'
import prisma from 'lib/prisma'
import { validateProject } from 'lib/middleware/validateProject'
import { DishWasherValidator } from 'lib/validators'
import { dishwasherUtilityUsage, dishwasherAnnualCostBreakdown } from 'internal-api/calculator/outputs/financial-results'
import { DishWasher } from 'internal-api/calculator/types/projects'
import { getUtilityGasEmissions } from 'internal-api/calculator/outputs/environmental-results'

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

async function getDishwasher(req: NextApiRequestWithUser, res: NextApiResponse<{ dishwasher: PrismaDishwasher | null; stats: DishwasherStats | null }>) {
  const projectId = req.query.projectId as string
  const dishwasher = await prisma.dishwasher.findFirst({
    where: {
      projectId,
    },
  })

  let stats: DishwasherStats | null = null
  if (dishwasher) {
    // TODO: Look up by state, save state per account
    const utilityRates = {
      gas: 0.92,
      electric: 0.11,
      water: 0.08,
    }
    const usage = dishwasherUtilityUsage(dishwasher as DishWasher)
    const costs = dishwasherAnnualCostBreakdown(dishwasher as DishWasher, utilityRates)
    const emissions = getUtilityGasEmissions(dishwasher as DishWasher)
    stats = {
      electricUsage: usage.electricUsage,
      electricCO2Weight: emissions.electric,
      electricCost: costs.electric,
      gasUsage: usage.gasUsage,
      gasCO2Weight: emissions.gas,
      gasCost: costs.gas,
      waterUsage: usage.waterUsage,
      waterCost: costs.water,
    }
  }
  res.status(200).json({ dishwasher, stats })
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

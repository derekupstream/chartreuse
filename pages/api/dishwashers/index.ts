import type { Dishwasher as PrismaDishwasher, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { DishwasherStats } from 'lib/calculator/calculations/dishwashing/getDishwasherStats';
import { getDishwasherStats } from 'lib/calculator/calculations/dishwashing/getDishwasherStats';
import type { UtilityRates } from 'lib/calculator/constants/utilities';
import { getProjectUtilities } from 'lib/calculator/constants/utilities';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import { validateProject } from 'lib/middleware/validateProject';
import prisma from 'lib/prisma';
import { DishWasherValidator } from 'lib/validators';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).use(validateProject).get(getDishwashers).post(createDishwasher).delete(deleteDishwasher);

export interface Response {
  accountId: string;
  dishwashers: { dishwasher: PrismaDishwasher; stats: DishwasherStats }[];
  state: string | null;
  rates: UtilityRates;
}

async function getDishwashers(req: NextApiRequestWithUser, res: NextApiResponse<Response>) {
  const projectId = req.query.projectId as string;
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      org: {
        select: {
          useMetricSystem: true
        }
      },
      singleUseItems: true
    }
  });
  const dishwashers = await prisma.dishwasher.findMany({
    where: {
      projectId
    }
  });
  const inventory = await getProjectInventory(projectId);
  const products = await getSingleUseProducts({ orgId: project.orgId });

  const accountId = project.accountId;
  const rates = getProjectUtilities(project);
  const racksUsed = inventory.racksUsedForEventProjects;
  const dishwasherDTOs = dishwashers.map(dishwasher => ({
    dishwasher,
    stats: getDishwasherStats({ rates, dishwasher, racksUsed })
  }));

  res.status(200).json({ accountId, dishwashers: dishwasherDTOs, state: project.USState, rates });
}

async function createDishwasher(
  req: NextApiRequestWithUser,
  res: NextApiResponse<{ dishwasher?: PrismaDishwasher; error?: string }>
) {
  const data: Prisma.DishwasherCreateArgs['data'] = {
    racksPerDay: req.body.racksPerDay,
    boosterWaterHeaterFuelType: req.body.boosterWaterHeaterFuelType ?? '',
    buildingWaterHeaterFuelType: req.body.buildingWaterHeaterFuelType,
    energyStarCertified: req.body.energyStarCertified,
    operatingDays: req.body.operatingDays,
    newOperatingDays: req.body.newOperatingDays,
    newRacksPerDay: req.body.newRacksPerDay,
    projectId: req.body.projectId,
    temperature: req.body.temperature,
    type: req.body.type
  };
  DishWasherValidator.parse(data);

  let dishwasher: PrismaDishwasher | undefined;

  if (req.body.id) {
    dishwasher = await prisma.dishwasher.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    dishwasher = await prisma.dishwasher.create({
      data
    });
  }
  res.status(200).json({ dishwasher });
}

async function deleteDishwasher(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.dishwasher.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId
    }
  });
  res.status(200).json({});
}

export default handler;

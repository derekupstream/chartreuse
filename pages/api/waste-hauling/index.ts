import type { Prisma, WasteHaulingCost } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { onError, onNoMatch, getUser } from 'lib/middleware';
import { validateProject } from 'lib/middleware/validateProject';
import prisma from 'lib/prisma';
import { CreateWasteHaulingCostValidator } from 'lib/validators';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(getUser)
  .use(validateProject)
  .get(getWasteHaulingCosts)
  .post(createWasteHaulingCost)
  .delete(deleteWasteHaulingCost);

async function getWasteHaulingCosts(
  req: NextApiRequestWithUser,
  res: NextApiResponse<{ wasteHaulingCosts: WasteHaulingCost[] }>
) {
  const projectId = req.query.projectId as string;
  const wasteHaulingCosts = await prisma.wasteHaulingCost.findMany({
    where: {
      projectId
    }
  });
  res.status(200).json({ wasteHaulingCosts });
}

async function createWasteHaulingCost(
  req: NextApiRequestWithUser,
  res: NextApiResponse<{ wasteHaulingCost: WasteHaulingCost }>
) {
  const data: Prisma.WasteHaulingCostCreateArgs['data'] = {
    projectId: req.body.projectId,
    monthlyCost: req.body.monthlyCost,
    newMonthlyCost: req.body.newMonthlyCost,
    wasteStream: req.body.wasteStream,
    serviceType: req.body.serviceType,
    description: req.body.description
  };

  CreateWasteHaulingCostValidator.parse(data);

  let wasteHaulingCost: WasteHaulingCost;

  if (req.body.id) {
    wasteHaulingCost = await prisma.wasteHaulingCost.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    wasteHaulingCost = await prisma.wasteHaulingCost.create({
      data
    });
  }

  res.status(200).json({ wasteHaulingCost });
}

async function deleteWasteHaulingCost(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.wasteHaulingCost.deleteMany({
    where: {
      id: req.body.id,
      projectId: req.body.projectId
    }
  });
  res.status(200).json({});
}

export default handler;

import type { TruckTransportationCost } from '@prisma/client';
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = projectHandler();

handler.get(getItems).post(addOrUpdateItem).delete(deleteItem);

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<TruckTransportationCost[]>) {
  const projectId = req.query.id as string;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const lineItems = await prisma.truckTransportationCost.findMany({
    where: {
      projectId
    }
  });
  res.status(200).json(lineItems);
}

async function addOrUpdateItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.body.id) {
    await prisma.truckTransportationCost.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    await prisma.truckTransportationCost.create({
      data: {
        ...req.body,
        projectId: req.query.id as string
      }
    });
  }

  res.status(200).json({ success: true });
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.truckTransportationCost.delete({
    where: {
      id: req.body.id
    }
  });
  res.status(200).json({ success: true });
}

export default handler;

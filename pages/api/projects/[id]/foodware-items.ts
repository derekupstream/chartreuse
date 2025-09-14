import type { NextApiResponse } from 'next';
import type { EventFoodwareLineItem as PrismaEventFoodwareLineItem } from '@prisma/client';
import type { FoodwareLineItem } from 'lib/projects/getProjectFoodwareLineItems';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import { getProjectFoodwareLineItems } from 'lib/projects/getProjectFoodwareLineItems';
import prisma from 'lib/prisma';

export type ModifyFoodwareLineItemRequest = {
  id?: string;
  projectId?: string; // required for new items
  singleUseProductId?: string;
  reusableProductId?: string;
  reusableItemCount?: number;
  reusableReturnPercentage?: number;
  waterUsageGallons?: number;
};

const handler = projectHandler();

handler.get(getItems).post(addOrUpdateItem).delete(deleteItem);

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<FoodwareLineItem[]>) {
  const projectId = req.query.id as string;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const lineItems = await getProjectFoodwareLineItems(projectId);

  return res.status(200).json(lineItems);
}

async function addOrUpdateItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  let lineItem: PrismaEventFoodwareLineItem;

  if (req.body.id) {
    lineItem = await prisma.eventFoodwareLineItem.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    if (!req.body.projectId) throw new Error('Project id is required to add an item');
    lineItem = await prisma.eventFoodwareLineItem.create({
      data: req.body
    });
  }

  res.status(200).json({ lineItem });
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.eventFoodwareLineItem.delete({
    where: { id: req.body.id }
  });
  return res.status(200).json({ success: true });
}

export default handler;

import type { ReusableLineItem } from '@prisma/client';
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = projectHandler();

handler.get(getItems).post(addOrUpdateItem).delete(deleteItem);

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<{ lineItems?: ReusableLineItem[] }>) {
  const projectId = req.query.id as string;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const lineItems = await prisma.reusableLineItem.findMany({
    where: {
      projectId
    }
  });

  return res.status(200).json({ lineItems });
}

async function addOrUpdateItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  let lineItem: ReusableLineItem;

  if (req.body.id) {
    lineItem = await prisma.reusableLineItem.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    lineItem = await prisma.reusableLineItem.create({
      data: req.body
    });
  }

  res.status(200).json({ lineItem });
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  const lineItem = await prisma.reusableLineItem.delete({
    where: { id: req.body.id }
  });
  return res.status(200).json({ lineItem });
}

export default handler;

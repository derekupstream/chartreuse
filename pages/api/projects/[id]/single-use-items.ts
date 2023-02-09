import type { SingleUseLineItem } from '@prisma/client';
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = projectHandler();

handler.get(getItems).post(addItem).delete(deleteItem);

async function getItems(req: NextApiRequestWithUser, res: NextApiResponse<{ lineItems?: SingleUseLineItem[] }>) {
  const projectId = req.query.id as string;

  if (typeof projectId !== 'string') throw new Error('No project id provided');

  const lineItems = await prisma.singleUseLineItem.findMany({
    where: {
      projectId
    }
  });
  res.status(200).json({ lineItems });
}

async function addItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  let lineItem: SingleUseLineItem;

  if (req.body.id) {
    lineItem = await prisma.singleUseLineItem.update({
      where: {
        id: req.body.id
      },
      data: req.body
    });
  } else {
    lineItem = await prisma.singleUseLineItem.create({
      data: req.body
    });
  }

  res.status(200).json({ lineItem });
}

async function deleteItem(req: NextApiRequestWithUser, res: NextApiResponse) {
  await prisma.singleUseLineItem.delete({
    where: {
      id: req.body.id
    }
  });
  res.status(200).json({ success: true });
}

export default handler;

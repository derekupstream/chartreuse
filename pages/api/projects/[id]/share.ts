import { Prisma } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

export type ProjectShareRequest = {
  publicSlug: string | null; // set to null to remove public access
};

const handler = handlerWithUser();

handler.put(toggleProjectPublic);

async function toggleProjectPublic(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { publicSlug } = req.body;

  if (!publicSlug) {
    throw new Error('publicSlug is required');
  }

  await prisma.project.update<Prisma.ProjectUpdateArgs>({
    where: {
      id: req.query.id as string
    },
    data: {
      publicSlug
    }
  });

  return res.status(200).end();
}

export default handler;

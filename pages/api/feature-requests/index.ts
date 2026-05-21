import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';
import prisma from 'lib/prisma';

export type FeatureRequestListItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  voteCount: number;
  youVoted: boolean;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).get(list).post(create);

async function list(req: NextApiRequestWithUser, res: NextApiResponse<{ items: FeatureRequestListItem[] }>) {
  const userId = req.user.id;
  const requests = await prisma.featureRequest.findMany({
    include: {
      votes: { select: { userId: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  const items = requests
    .map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      voteCount: r.votes.length,
      youVoted: r.votes.some(v => v.userId === userId)
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  return res.status(200).json({ items });
}

async function create(req: NextApiRequestWithUser, res: NextApiResponse) {
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title required' });
  }
  const created = await prisma.featureRequest.create({
    data: {
      title: title.trim().slice(0, 200),
      description: description?.trim().slice(0, 2000) || null,
      createdByUserId: req.user.id
    }
  });
  return res.status(200).json({ id: created.id });
}

export default handler;

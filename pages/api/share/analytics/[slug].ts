import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllProjections } from 'lib/calculator/getProjections';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { slug } = req.query as { slug: string };

  const org = await prisma.org.findUnique({
    where: { analyticsSlug: slug }
  });

  if (!org) return res.status(404).json({ error: 'Not found' });

  const projects = await prisma.project.findMany({
    where: { orgId: org.id, isTemplate: false, category: 'default' },
    include: { account: true, org: true, tags: true }
  });

  const data = await getAllProjections(projects);

  return res.json(serializeJSON({ org, data }));
}

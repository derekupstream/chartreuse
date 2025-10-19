import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orgId } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const tags = await prisma.projectTag.findMany({
          where: { orgId: String(orgId) },
          orderBy: { index: 'asc' }
        });
        res.status(200).json(tags);
      } catch (error) {
        console.error('Error fetching tags', (error as Error).stack);
        res.status(500).json({ error: 'Failed to fetch tags' });
      }
      break;

    case 'POST':
      const { label } = req.body;
      try {
        const latestIndex = await prisma.projectTag.findFirst({
          where: { orgId: String(orgId) },
          orderBy: { index: 'desc' }
        });
        const newTag = await prisma.projectTag.create({
          data: { label, orgId: String(orgId), index: latestIndex ? latestIndex.index + 1 : 0 }
        });
        res.status(201).json(newTag);
      } catch (error) {
        console.error('Error creating tag', (error as Error).stack);
        res.status(500).json({ error: 'Failed to create tag' });
      }
      break;

    case 'DELETE':
      const { tagId } = req.body;
      try {
        await prisma.projectTag.delete({
          where: { id: tagId }
        });
        res.status(200).json({ message: 'Tag deleted successfully' });
      } catch (error) {
        console.error('Error deleting tag', (error as Error).stack);
        res.status(500).json({ error: 'Failed to delete tag' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

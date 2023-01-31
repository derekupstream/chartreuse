import type { Prisma, Project } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { ProjectMetadata } from 'components/projects/[id]/edit';
import prisma from 'lib/prisma';

type Response = {
  project?: Project;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing id' });

  if (req.method === 'DELETE') {
    try {
      const project = await prisma.project.delete<Prisma.ProjectDeleteArgs>({
        where: {
          id: req.query.id as string
        }
      });

      return res.status(200).json({ project });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, metadata, accountId, orgId } = req.body;

      const project = await prisma.project.update<Prisma.ProjectUpdateArgs>({
        where: {
          id: req.query.id as string
        },
        data: {
          name,
          metadata: metadata as ProjectMetadata,
          account: {
            connect: {
              id: accountId
            }
          },
          org: {
            connect: {
              id: orgId
            }
          }
        }
      });

      return res.status(200).json({ project });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ error: 'Method not allowed' });
}

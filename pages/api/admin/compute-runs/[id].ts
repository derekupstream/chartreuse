import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.query as { id: string };

  const run = await prisma.computeRun.findUnique({
    where: { id },
    include: {
      org: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      snapshot: {
        include: {
          factorVersions: {
            include: {
              factorVersion: {
                include: {
                  factor: { select: { name: true, calculatorConstantKey: true, unit: true } }
                }
              }
            }
          }
        }
      },
      results: { orderBy: { metricKey: 'asc' } },
      milestones: {
        select: {
          id: true,
          label: true,
          snapshotDate: true,
          project: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!run) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ run });
});

import type { NextApiResponse } from 'next';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { Prisma } from '@prisma/client';
import prisma from 'lib/prisma';
import { runDataHealthScan } from 'lib/admin/dataHealthScan';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const issues = await runDataHealthScan();

  await Promise.all(
    issues.map(issue =>
      prisma.dataHealthIssue.upsert({
        where: {
          issueType_entityId: {
            issueType: issue.issueType,
            entityId: issue.entityId
          }
        },
        create: {
          issueType: issue.issueType,
          severity: issue.severity,
          entity: issue.entity,
          entityId: issue.entityId,
          details: (issue.details ?? undefined) as Prisma.InputJsonValue | undefined,
          status: 'open'
        },
        update: {
          severity: issue.severity,
          details: (issue.details ?? undefined) as Prisma.InputJsonValue | undefined
          // Do NOT include status — preserve acknowledged/resolved state
        }
      })
    )
  );

  const all = await prisma.dataHealthIssue.findMany({
    where: { status: { not: 'resolved' } },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }]
  });
  res.json(all);
});

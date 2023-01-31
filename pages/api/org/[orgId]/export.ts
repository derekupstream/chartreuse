import type { NextApiResponse } from 'next';

import { getOrgExport } from 'lib/exports';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();

handler.get(getOrgExportMiddleware);

async function getOrgExportMiddleware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string;

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: req.user.id
    },
    include: {
      org: true
    }
  });

  if (user.org.id !== orgId && !user.org.isUpstream) {
    throw new Error('User does not have access to this org');
  }

  const file = await getOrgExport(orgId);
  const buffer = await file.xlsx.writeBuffer();

  // write the file to the response (should prompt user to download or open the file)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Length', Buffer.byteLength(buffer));
  res.setHeader('Content-Disposition', `attachment; filename=OrgExport-${orgId}.xlsx`);
  res.write(buffer, 'binary');
  res.end();

  res.status(200).end();
}

export default handler;

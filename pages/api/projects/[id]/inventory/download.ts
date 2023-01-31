import type { NextApiResponse } from 'next';

import { getProjectInventoryExport } from 'lib/inventory/getProjectInventoryExport';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';

const handler = projectHandler();

handler.get(exportEndpoint);

async function exportEndpoint(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id as string;

  const file = await getProjectInventoryExport(projectId);

  const buffer = await file.xlsx.writeBuffer();

  // write the file to the response (should prompt user to download or open the file)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Length', Buffer.byteLength(buffer));
  res.setHeader('Content-Disposition', `attachment; filename=OrgExport-${projectId}.xlsx`);
  res.write(buffer, 'binary');
  res.end();

  res.status(200).end();
}

export default handler;

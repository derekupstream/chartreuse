import type ExcelJS from 'exceljs';
import type { NextApiResponse } from 'next';

import { getUserExport } from 'lib/exports';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';

const handler = handlerWithUser();

handler.use(requireUpstream).get(exportUsersMiddleware);

async function exportUsersMiddleware(req: NextApiRequestWithUser, res: NextApiResponse) {
  const orgId = req.query.orgId as string | undefined;
  const exportType = req.query.type;

  let file: ExcelJS.Workbook;

  if (exportType === 'users') {
    file = await getUserExport();
  } else {
    return res.status(400).send({ message: `Invalid export type: ${exportType}` });
  }

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

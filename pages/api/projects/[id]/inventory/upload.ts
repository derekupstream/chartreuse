import type { NextApiResponse } from 'next';

import type { InventoryInput } from 'lib/inventory/saveInventoryRecords';
import { saveInventoryRecords } from 'lib/inventory/saveInventoryRecords';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { projectHandler } from 'lib/middleware';

const handler = projectHandler();

handler.post(uploadEndpoint);

async function uploadEndpoint(req: NextApiRequestWithUser, res: NextApiResponse) {
  const projectId = req.query.id as string;

  await saveInventoryRecords(projectId, req.body as InventoryInput);

  res.status(200).end();
}

export default handler;

import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { sendEventOnce } from 'lib/mailchimp/sendEvent';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import getUser from 'lib/middleware/getUser';
import onError from 'lib/middleware/onError';
import onNoMatch from 'lib/middleware/onNoMatch';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(getUser).post(sendEventEndpoint);

async function sendEventEndpoint(req: NextApiRequestWithUser, res: NextApiResponse) {
  await sendEventOnce(req.body.name, {
    userId: req.user.id,
    email: req.user.email
  });

  return res.status(200).end();
}

export default handler;

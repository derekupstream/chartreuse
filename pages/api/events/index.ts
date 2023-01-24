import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import getUser, { NextApiRequestWithUser } from 'lib/middleware/getUser'
import onError from 'lib/middleware/onError'
import onNoMatch from 'lib/middleware/onNoMatch'
import { sendEventOnce } from 'lib/mailchimp/sendEvent'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

handler.use(getUser).post(sendEventEndpoint)

async function sendEventEndpoint(req: NextApiRequestWithUser, res: NextApiResponse) {
  await sendEventOnce(req.body.name, {
    userId: req.user.id,
    email: req.user.email,
  })

  return res.status(200).end()
}

export default handler

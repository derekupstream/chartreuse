import { NextApiRequest, NextApiResponse } from 'next'

export default function onError(req: NextApiRequest, res: NextApiResponse) {
  res.status(405).send('Method not allowed')
}

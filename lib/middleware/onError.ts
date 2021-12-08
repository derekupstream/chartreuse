import { NextApiRequest, NextApiResponse } from 'next'

export default function onError(err: any, req: NextApiRequest, res: NextApiResponse, next: Function) {
  console.error(err.stack || err)
  res.status(500).json({ error: 'Something went wrong!' })
}

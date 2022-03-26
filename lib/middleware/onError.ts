import { NextApiRequest, NextApiResponse } from 'next'

export function onError(err: any, req: NextApiRequest, res: NextApiResponse, next: Function) {
  console.error(err.stack || err)
  res.status(500).json({ message: 'Something went wrong!' })
}

export default onError

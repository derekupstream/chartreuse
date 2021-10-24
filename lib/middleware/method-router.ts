import { NextApiRequest, NextApiResponse } from 'next'

export type Route<T = any> = (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void>

export interface MethodHandlers {
  GET?: Route
  POST?: Route
  PUT?: Route
  DELETE?: Route
}

export default function methodRouter(handlers: MethodHandlers) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler: Route | undefined = handlers[req.method as keyof MethodHandlers]
    if (handler) {
      await handler(req, res)
    } else {
      res.status(405).send('Method not allowed')
    }
  }
}

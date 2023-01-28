import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser } from 'lib/middleware'
import { validateProject } from 'lib/middleware/validateProject'

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })

export function defaultHandler() {
  return handler
}

export function handlerWithUser() {
  return handler.use(getUser)
}

export function projectHandler() {
  return handler.use(getUser).use(validateProject)
}

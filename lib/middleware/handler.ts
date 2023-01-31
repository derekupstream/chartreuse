import nc from 'next-connect'
import type { NextApiRequest, NextApiResponse } from 'next'
import { onError, onNoMatch, getUser } from 'lib/middleware'
import { validateProject } from 'lib/middleware/validateProject'

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch })
}

export function handlerWithUser() {
  return defaultHandler().use(getUser)
}

export function projectHandler() {
  return defaultHandler().use(getUser).use(validateProject)
}

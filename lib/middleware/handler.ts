import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError } from 'lib/middleware/onError';
import { onNoMatch } from 'lib/middleware/onNoMatch';
import { getUser } from 'lib/middleware/getUser';
import { validateProject } from 'lib/middleware/validateProject';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
}

export function handlerWithUser() {
  return defaultHandler().use(getUser);
}

export function projectHandler() {
  return defaultHandler().use(getUser).use(validateProject);
}

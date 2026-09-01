import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { STALE_SERVER_MESSAGE, schemaIsStale } from 'lib/devSchemaGuard';
import { onError } from 'lib/middleware/onError';
import { onNoMatch } from 'lib/middleware/onNoMatch';
import { getUser } from 'lib/middleware/getUser';
import { validateProject } from 'lib/middleware/validateProject';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch }).use((_req, res, next) => {
    // Dev-only: a schema change after boot turns every query error into one clear answer.
    if (schemaIsStale()) return res.status(503).json({ error: STALE_SERVER_MESSAGE });
    next();
  });
}

export function handlerWithUser() {
  return defaultHandler().use(getUser);
}

export function projectHandler() {
  return defaultHandler().use(getUser).use(validateProject);
}

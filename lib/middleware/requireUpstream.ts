import type { NextApiResponse } from 'next';

import prisma from 'lib/prisma';

import type { NextApiRequestWithUser } from './getUser';

/**
 * getServerSideProps return value for non-Upstream users hitting /admin pages.
 * Sends them to the login screen, where the access_denied error pops a message.
 */
export const ACCESS_DENIED_REDIRECT = {
  redirect: { permanent: false, destination: '/login?error=access_denied' }
} as const;

export async function checkIsUpstream(orgId: string) {
  return prisma.org
    .count({
      where: {
        id: orgId,
        isUpstream: true
      }
    })
    .then(count => count > 0);
}

export async function requireUpstream(req: NextApiRequestWithUser, res: NextApiResponse, next: () => void) {
  const isUpstream = await checkIsUpstream(req.user.orgId);

  if (!isUpstream) {
    res.status(401).send('Access denied');
  } else {
    console.log(`Upstream route requested: [${req.method}] ${req.url}`, {
      userId: req.user.id
    });
    next();
  }
}

export default requireUpstream;

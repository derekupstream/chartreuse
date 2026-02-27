import type { NextApiResponse } from 'next';
import { serialize } from 'cookie';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export const IMPERSONATION_COOKIE = 'cr_impersonate';
const COOKIE_MAX_AGE = 60 * 60 * 4; // 4 hours

export default handlerWithUser()
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    // Don't allow impersonating another upstream admin
    const targetOrg = await prisma.org.findUnique({ where: { id: target.orgId }, select: { isUpstream: true } });
    if (targetOrg?.isUpstream) return res.status(403).json({ error: 'Cannot impersonate upstream users' });

    const session = await prisma.impersonationSession.create({
      data: {
        adminUserId: req.user.id,
        targetUserId,
        expiresAt: new Date(Date.now() + COOKIE_MAX_AGE * 1000)
      }
    });

    res.setHeader(
      'Set-Cookie',
      serialize(IMPERSONATION_COOKIE, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE
      })
    );

    res.json({ ok: true });
  })
  .delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const sessionId = req.cookies[IMPERSONATION_COOKIE];
    if (sessionId) {
      await prisma.impersonationSession.deleteMany({ where: { id: sessionId } }).catch(() => {});
    }

    res.setHeader('Set-Cookie', serialize(IMPERSONATION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 }));

    res.json({ ok: true });
  });

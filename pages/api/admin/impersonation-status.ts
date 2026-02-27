import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseApiClient } from 'lib/auth/supabaseServer';
import prisma from 'lib/prisma';
import { IMPERSONATION_COOKIE } from './impersonate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const sessionId = req.cookies[IMPERSONATION_COOKIE];
  if (!sessionId) return res.json({ impersonating: false });

  const supabase = createSupabaseApiClient(req, res);
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();
  if (!authUser) return res.json({ impersonating: false });

  const session = await prisma.impersonationSession.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt <= new Date() || session.adminUserId !== authUser.id) {
    return res.json({ impersonating: false });
  }

  const target = await prisma.user.findUnique({
    where: { id: session.targetUserId },
    include: { org: { select: { name: true } } }
  });

  if (!target) return res.json({ impersonating: false });

  return res.json({
    impersonating: true,
    targetUser: { name: target.name, email: target.email, orgName: (target as any).org?.name ?? '' }
  });
}

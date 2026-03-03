import { createClient } from '@supabase/supabase-js';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  const userId = req.query.id as string;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, orgId: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userOrg = await prisma.org.findUnique({ where: { id: user.orgId }, select: { isUpstream: true } });
  if (userOrg?.isUpstream) return res.status(403).json({ error: 'Cannot reset password of upstream users' });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.host ?? 'localhost:3000';
  const redirectTo = `${proto}://${host}/auth/callback`;

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ ok: true });
});

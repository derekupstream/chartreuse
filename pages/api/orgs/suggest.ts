import type { NextApiRequest, NextApiResponse } from 'next';

import { createSupabaseApiClient } from 'lib/auth/supabaseServer';
import { isPersonalEmailDomain } from 'lib/admin/duplicateDetector';
import prisma from 'lib/prisma';

export type SuggestedOrg = {
  id: string;
  name: string;
  memberCount: number;
  adminName: string | null;
  adminEmail: string | null;
};

/**
 * Returns orgs where at least one user shares the requester's email domain.
 * Used by the signup form so a new user signing up for an existing company
 * can join their org instead of creating a duplicate.
 *
 * Requires a Supabase session — the requester may not yet have a DB User row
 * (this is signup-time), so we don't go through getUser middleware.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const supabase = createSupabaseApiClient(req, res);
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const email = session.user.email;
  const domain = email?.split('@')[1]?.toLowerCase();
  if (!domain || isPersonalEmailDomain(domain)) {
    return res.status(200).json({ items: [] });
  }

  const orgs = await prisma.org.findMany({
    where: {
      users: { some: { email: { endsWith: `@${domain}` } } }
    },
    select: {
      id: true,
      name: true,
      users: {
        select: { name: true, email: true, role: true }
      }
    },
    take: 10
  });

  const items: SuggestedOrg[] = orgs.map(org => {
    const admin = org.users.find(u => u.role === 'ORG_ADMIN') ?? org.users[0];
    return {
      id: org.id,
      name: org.name,
      memberCount: org.users.length,
      adminName: admin?.name ?? null,
      adminEmail: admin?.email ?? null
    };
  });

  return res.status(200).json({ items });
}

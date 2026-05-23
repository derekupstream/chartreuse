import type { NextApiRequest, NextApiResponse } from 'next';

import { createSupabaseApiClient } from 'lib/auth/supabaseServer';
import { sendEmail } from 'lib/mailgun';
import prisma from 'lib/prisma';

type CreateBody = {
  orgId: string;
  name: string;
  message?: string;
};

export type CreateJoinRequestResponse = {
  id: string;
  orgName: string;
};

/**
 * Create an inbound 'request to join' for the authenticated user.
 *
 * Like /api/orgs/suggest, we bypass the standard getUser middleware because
 * the requester legitimately has no DB User row yet — they're trying to get
 * into an org. We do require a valid Supabase session so we know who's asking.
 *
 * Domain check: at least one existing member of the target org must share
 * the requester's email domain. Prevents random spam against unrelated orgs.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const supabase = createSupabaseApiClient(req, res);
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requesterEmail = session.user.email.toLowerCase();
  const requesterDomain = requesterEmail.split('@')[1];
  const { orgId, name, message } = (req.body || {}) as CreateBody;

  if (!orgId || !name?.trim()) {
    return res.status(400).json({ error: 'Missing required fields: orgId, name' });
  }

  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      users: {
        where: { role: 'ORG_ADMIN' },
        select: { email: true, name: true }
      }
    }
  });
  if (!org) {
    return res.status(404).json({ error: 'Org not found' });
  }

  const domainMatch = await prisma.user.findFirst({
    where: { orgId: org.id, email: { endsWith: `@${requesterDomain}` } },
    select: { id: true }
  });
  if (!domainMatch) {
    return res.status(403).json({ error: 'Your email domain does not match this organization' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: requesterEmail } });
  if (existingUser) {
    return res.status(409).json({ error: 'You already have an account' });
  }

  const joinRequest = await prisma.joinRequest.upsert({
    where: { email_orgId: { email: requesterEmail, orgId: org.id } },
    create: {
      email: requesterEmail,
      name: name.trim(),
      message: message?.trim() || null,
      orgId: org.id,
      status: 'pending'
    },
    update: {
      name: name.trim(),
      message: message?.trim() || null,
      status: 'pending',
      decidedAt: null,
      decidedById: null
    }
  });

  const adminEmails = org.users.map(u => u.email).filter(Boolean);
  if (adminEmails.length > 0) {
    const origin = req.headers.origin || `https://${req.headers.host}`;
    for (const to of adminEmails) {
      try {
        await sendEmail({
          from: 'Chart-Reuse <hello@chart-reuse.eco>',
          to,
          subject: `${name} requested to join ${org.name} on Chart-Reuse`,
          template: 'join-request-received',
          'v:requesterName': name,
          'v:requesterEmail': requesterEmail,
          'v:requesterMessage': message || '',
          'v:orgName': org.name,
          'v:membersUrl': `${origin}/members`
        });
      } catch (err) {
        console.error('Failed to send join-request email to admin', to, err);
      }
    }
  }

  return res.status(201).json({ id: joinRequest.id, orgName: org.name } satisfies CreateJoinRequestResponse);
}

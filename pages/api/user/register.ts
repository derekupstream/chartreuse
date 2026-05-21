import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuid } from 'uuid';

import { isPersonalEmailDomain } from 'lib/admin/duplicateDetector';
import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';
import { trackEvent } from 'lib/tracking';

export type RegisterRequestBody = {
  id: string;
  name: string;
  phone?: string;
  email: string;
  title?: string;
  orgName: string;
  /** If set, join this existing org instead of creating a new one. */
  inviteCode?: string;
  /** Set true on a retry after the user saw same-domain orgs and chose to
   * create a new one anyway. Bypasses the 409 dupe-suggestion response. */
  confirmCreate?: boolean;
};

export type RegisterDupeResponse = {
  error: 'org_exists';
  message: string;
  suggestions: Array<{
    id: string;
    name: string;
    memberCount: number;
    adminName: string | null;
    adminEmail: string | null;
    inviteCode: string | null;
  }>;
};

const handler = defaultHandler();

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, name, email, title, phone, orgName, inviteCode, confirmCreate } = req.body as RegisterRequestBody;

  const trimmedOrgName = orgName.trim();
  const emailDomain = email.split('@')[1]?.toLowerCase();

  // ─── Path 1: invite code → join existing org ────────────────────────────────
  if (inviteCode) {
    const code = inviteCode.trim().toUpperCase();
    const org = await prisma.org.findUnique({ where: { orgInviteCode: code } });
    if (!org) {
      return res.status(400).json({ error: 'invalid_invite_code', message: 'Invite code not recognized.' });
    }

    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        title,
        phone,
        role: Role.ORG_ADMIN, // first user in an existing org via invite still gets admin; downgrade in UI if needed
        org: { connect: { id: org.id } }
      }
    });

    await trackEvent({ type: 'signup', userId: user.id, props: { joinedViaInvite: true, orgId: org.id } });
    return res.status(200).json({ joinedOrg: { id: org.id, name: org.name } });
  }

  // ─── Path 2: domain-based dupe check (only for work emails) ─────────────────
  if (emailDomain && !isPersonalEmailDomain(emailDomain) && !confirmCreate) {
    const sameDomainOrgs = await prisma.org.findMany({
      where: {
        users: { some: { email: { endsWith: `@${emailDomain}` } } }
      },
      select: {
        id: true,
        name: true,
        orgInviteCode: true,
        users: {
          select: { name: true, email: true, role: true }
        }
      },
      take: 10
    });

    if (sameDomainOrgs.length > 0) {
      const suggestions = sameDomainOrgs.map(org => {
        const admin = org.users.find(u => u.role === 'ORG_ADMIN') ?? org.users[0];
        return {
          id: org.id,
          name: org.name,
          memberCount: org.users.length,
          adminName: admin?.name ?? null,
          adminEmail: admin?.email ?? null,
          inviteCode: org.orgInviteCode
        };
      });

      const response: RegisterDupeResponse = {
        error: 'org_exists',
        message: `We found ${sameDomainOrgs.length} existing organization${
          sameDomainOrgs.length === 1 ? '' : 's'
        } for @${emailDomain}. Join one of those or confirm to create a new one.`,
        suggestions
      };
      return res.status(409).json(response);
    }
  }

  // ─── Path 3: create new org ─────────────────────────────────────────────────
  const orgId = uuid();

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      title,
      phone,
      role: Role.ORG_ADMIN,
      org: {
        create: {
          id: orgId,
          name: trimmedOrgName
        }
      }
    }
  });

  await prisma.account.create({
    data: {
      name: trimmedOrgName,
      accountContactEmail: email,
      org: { connect: { id: user.orgId } }
    }
  });

  await trackEvent({ type: 'signup', userId: user.id });
  return res.status(200).end();
});

export default handler;

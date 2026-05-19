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
};

const handler = defaultHandler();

handler.post(async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, name, email, title, phone, orgName } = req.body as RegisterRequestBody;

  const trimmedOrgName = orgName.trim();
  const emailDomain = email.split('@')[1]?.toLowerCase();

  if (emailDomain && !isPersonalEmailDomain(emailDomain)) {
    const existingOrgWithSameDomain = await prisma.org.findFirst({
      where: {
        name: { equals: trimmedOrgName, mode: 'insensitive' },
        users: { some: { email: { endsWith: `@${emailDomain}` } } }
      },
      select: {
        id: true,
        name: true,
        orgInviteCode: true,
        users: {
          where: { role: 'ORG_ADMIN' },
          select: { email: true, name: true },
          take: 1
        }
      }
    });

    if (existingOrgWithSameDomain) {
      const admin = existingOrgWithSameDomain.users[0];
      return res.status(409).json({
        error: 'org_exists',
        message: `An organization called "${existingOrgWithSameDomain.name}" already exists for users on @${emailDomain}.${
          admin ? ` Ask ${admin.name ?? admin.email} to invite you.` : ''
        }${
          existingOrgWithSameDomain.orgInviteCode
            ? ` Or use invite code ${existingOrgWithSameDomain.orgInviteCode}.`
            : ''
        }`,
        existingOrg: {
          name: existingOrgWithSameDomain.name,
          orgInviteCode: existingOrgWithSameDomain.orgInviteCode,
          adminEmail: admin?.email
        }
      });
    }
  }

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

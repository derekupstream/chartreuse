import { Role } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { trackEvent } from 'lib/tracking';
import { defaultHandler } from 'lib/middleware/handler';
import prisma from 'lib/prisma';

const handler = defaultHandler();

export type RequestBody = {
  id: string;
  email: string;
  orgId: string;
  businessVenue: string;
  title?: string;
  name?: string;
  phone?: string;
};

type Response = {
  user?: any;
  error?: string;
};

handler.post(createInviteSignup);

async function createInviteSignup(req: NextApiRequest, res: NextApiResponse<Response>) {
  try {
    const { id, name, email, title, phone, orgId, businessVenue } = req.body as RequestBody;

    // Verify the org exists
    const org = await prisma.org.findUnique({
      where: { id: orgId }
    });

    if (!org) {
      return res.status(400).json({ error: 'Invalid organization' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create account first
    const account = await prisma.account.create({
      data: {
        name: businessVenue.trim(),
        accountContactEmail: email,
        org: {
          connect: {
            id: orgId
          }
        }
      }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        id,
        name,
        email,
        title,
        phone,
        role: Role.ACCOUNT_ADMIN,
        org: {
          connect: {
            id: orgId
          }
        },
        account: {
          connect: {
            id: account.id
          }
        }
      },
      include: {
        org: true
      }
    });

    await trackEvent({
      type: 'join_org',
      userId: user.id
    });

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export default handler;

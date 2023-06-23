import type { Prisma } from '@prisma/client';
import type { GetServerSidePropsContext } from 'next';
import nookies from 'nookies';

import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import prisma from 'lib/prisma';

type DecodedIdToken = Awaited<ReturnType<typeof verifyIdToken>>;

export async function getUserFromContext<T extends Partial<Prisma.UserInclude> = any>(
  context: GetServerSidePropsContext,
  dataToInclude: T = null as unknown as T
) {
  let token: DecodedIdToken;
  const cookies = nookies.get(context);

  try {
    if (!cookies.token) {
      throw new Error('Request requires authentication');
    }
    token = await verifyIdToken(cookies.token);
  } catch (error) {
    console.warn('Error retrieving user from cookie:', error);
    return {};
  }

  const user = await prisma.user.findUnique({
    where: {
      id: token.uid
    },
    include: dataToInclude
  });

  return { user, firebaseToken: token, verifiedEmail: cookies.verifiedEmail === 'true' };
}

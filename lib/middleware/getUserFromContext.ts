import type { Prisma } from '@prisma/client';
import type { GetServerSidePropsContext } from 'next';
import nookies from 'nookies';

import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import prisma from 'lib/prisma';

export async function getUserFromContext<T extends Partial<Prisma.UserInclude> = any>(context: GetServerSidePropsContext, dataToInclude: T = {} as T) {
  try {
    const cookies = nookies.get(context);
    if (!cookies.token) {
      throw new Error('Request requires authentication');
    }
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid
      },
      include: dataToInclude
    });

    return { user, firebaseToken: token };
  } catch (error) {
    console.error('Error retrieving user from cookie:', error);
    return {};
  }
}

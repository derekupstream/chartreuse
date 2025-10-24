import admin from 'firebase-admin';

import prisma from 'lib/prisma';

export const verifyIdToken = async (token?: string): Promise<{ uid: string }> => {
  if (typeof process.env.NEXT_PUBLIC_REMOTE_USER_ID === 'string') {
    return { uid: process.env.NEXT_PUBLIC_REMOTE_USER_ID };
  }
  if (typeof process.env.NEXT_PUBLIC_REMOTE_USER_EMAIL === 'string') {
    const user = await prisma.user.findUnique({
      where: {
        email: process.env.NEXT_PUBLIC_REMOTE_USER_EMAIL
      }
    });
    if (user) {
      return { uid: user.id };
    }
  }
  if (!token) {
    throw new Error('Request requires authentication');
  }
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.FIREBASE_ADMIN_EMAIL,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }

  return admin.auth().verifyIdToken(token);
};

import admin from 'firebase-admin';

export const verifyIdToken = async (token?: string): Promise<{ uid: string }> => {
  if (typeof process.env.NEXT_PUBLIC_REMOTE_USER_ID === 'string') {
    return { uid: process.env.NEXT_PUBLIC_REMOTE_USER_ID };
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

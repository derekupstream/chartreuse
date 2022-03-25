import admin from 'firebase-admin'

export const verifyIdToken = (token: string) => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        clientEmail: process.env.FIREBASE_ADMIN_EMAIL,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }

  return admin.auth().verifyIdToken(token)
}

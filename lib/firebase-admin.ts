// Gunakan dynamic import untuk firebase-admin
// File ini hanya boleh diimpor di sisi server (API routes, Server Components, atau Server Actions)

let auth: any = null

export async function getFirebaseAuth() {
  if (auth) return auth

  try {
    // Dynamic import untuk firebase-admin
    const admin = await import("firebase-admin")

    // Inisialisasi Firebase Admin SDK jika belum diinisialisasi
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    }

    auth = admin.auth()
    return auth
  } catch (error) {
    console.error("Firebase admin initialization error:", error)
    throw error
  }
}

export const auth = {
  verifyIdToken: async (token: string) => {
    const admin = await import("firebase-admin")
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    }
    return admin.auth().verifyIdToken(token)
  },
}

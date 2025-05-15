"use server"

import { cookies } from "next/headers"
import { createUser, getUserByEmail, getUserById } from "@/lib/models/user"
import { auth as adminAuth } from "@/lib/firebase-admin"
import { revalidatePath } from "next/cache"

// Sinkronkan user Firebase dengan database kita
export async function syncUserWithDatabase(firebaseUser: {
  uid: string
  email: string
  displayName: string
  photoURL: string
  idToken: string
}) {
  try {
    // Verifikasi token Firebase
    const decodedToken = await adminAuth.verifyIdToken(firebaseUser.idToken)

    // Cek apakah user sudah ada di database
    let user = await getUserByEmail(firebaseUser.email)

    if (!user) {
      // Buat user baru jika belum ada
      user = await createUser({
        email: firebaseUser.email,
        fullName: firebaseUser.displayName,
        avatarUrl: firebaseUser.photoURL,
        provider: "firebase",
        firebaseUid: firebaseUser.uid,
      })
    }

    // Set cookie dengan Firebase UID
    cookies().set({
      name: "firebase-auth-token",
      value: firebaseUser.idToken,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour (Firebase tokens expire after 1 hour)
      sameSite: "lax",
    })

    revalidatePath("/")
    return { success: true, user }
  } catch (error) {
    console.error("Error syncing user with database:", error)
    return { success: false, error: "Failed to sync user with database" }
  }
}

// Fungsi untuk mendapatkan user saat ini
export async function getUser() {
  try {
    const token = cookies().get("firebase-auth-token")?.value

    if (!token) {
      return null
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token)
      const user = await getUserById(decodedToken.uid)
      return user
    } catch (error) {
      // Token tidak valid atau kedaluwarsa
      cookies().delete("firebase-auth-token")
      return null
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

// Fungsi untuk logout
export async function logoutUser() {
  cookies().delete("firebase-auth-token")
  revalidatePath("/")
  return { success: true }
}

// Alias untuk kompatibilitas dengan kode yang sudah ada
export const loginUser = syncUserWithDatabase
export const signupUser = syncUserWithDatabase

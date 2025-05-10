"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  setupUserSecurity as setupSecurity,
  setupTwoFactor as setupTwoFactorModel,
  getUserSecurity,
  getUserPublicKey,
  logUserSession,
  getUserSessions,
  removeUserSession as removeSession,
} from "@/lib/models/security"
import { revalidatePath } from "next/cache"

// Fungsi untuk mengatur keamanan pengguna
export async function setupUserSecurity(encryptionEnabled: boolean, publicKey?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const security = await setupSecurity(user.id, encryptionEnabled, publicKey)
  return { data: security }
}

// Fungsi untuk mengatur verifikasi dua faktor
export async function setupTwoFactor(enabled: boolean, secret?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const security = await setupTwoFactorModel(user.id, enabled, secret)
  return { data: security }
}

// Fungsi untuk mendapatkan pengaturan keamanan pengguna
export async function getUserSecuritySettings() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const security = await getUserSecurity(user.id)
  return { data: security }
}

// Fungsi untuk mendapatkan kunci publik pengguna
export async function getUserPublicKeyAction(userId: string) {
  const publicKey = await getUserPublicKey(userId)
  return { publicKey }
}

// Fungsi untuk mencatat sesi pengguna
export async function logUserSessionAction(deviceInfo: string, ipAddress: string, location?: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const session = await logUserSession(user.id, deviceInfo, ipAddress, location)
  return { data: session }
}

// Fungsi untuk mendapatkan sesi pengguna
export async function getUserSessionsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const sessions = await getUserSessions(user.id)
  return { data: sessions }
}

// Fungsi untuk menghapus sesi pengguna
export async function removeUserSession(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const success = await removeSession(sessionId)
  revalidatePath("/profile/security")

  return { success }
}

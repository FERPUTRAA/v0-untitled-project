"use server"

import { revalidatePath } from "next/cache"
import { updateUser } from "@/lib/models/user"
import { getUser } from "./auth-actions"
import { generateTOTP, verifyTOTP } from "@/lib/two-factor-auth"
import { generateKeyPair } from "@/lib/encryption"

export async function setupTwoFactor() {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mengatur autentikasi dua faktor" }
  }

  try {
    // Generate TOTP secret
    const { secret, qrCodeUrl } = await generateTOTP(user.email)

    // Save the secret to the user's profile (but don't enable 2FA yet until verified)
    await updateUser(user.id, {
      totpSecret: secret,
      totpEnabled: false,
    })

    return { success: true, qrCodeUrl }
  } catch (error) {
    console.error("Setup two-factor error:", error)
    return { error: "Terjadi kesalahan saat mengatur autentikasi dua faktor" }
  }
}

export async function verifyAndEnableTwoFactor(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mengatur autentikasi dua faktor" }
  }

  const token = formData.get("token") as string

  if (!token) {
    return { error: "Token diperlukan" }
  }

  try {
    if (!user.totpSecret) {
      return { error: "Anda belum mengatur autentikasi dua faktor" }
    }

    const isValid = await verifyTOTP(user.totpSecret, token)

    if (!isValid) {
      return { error: "Token tidak valid" }
    }

    // Enable 2FA for the user
    await updateUser(user.id, {
      totpEnabled: true,
    })

    // Revalidate the security page
    revalidatePath("/profile/security")

    return { success: true }
  } catch (error) {
    console.error("Verify two-factor error:", error)
    return { error: "Terjadi kesalahan saat memverifikasi token" }
  }
}

export async function disableTwoFactor(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk menonaktifkan autentikasi dua faktor" }
  }

  const token = formData.get("token") as string

  if (!token) {
    return { error: "Token diperlukan" }
  }

  try {
    if (!user.totpSecret || !user.totpEnabled) {
      return { error: "Autentikasi dua faktor belum diaktifkan" }
    }

    const isValid = await verifyTOTP(user.totpSecret, token)

    if (!isValid) {
      return { error: "Token tidak valid" }
    }

    // Disable 2FA for the user
    await updateUser(user.id, {
      totpEnabled: false,
      totpSecret: null,
    })

    // Revalidate the security page
    revalidatePath("/profile/security")

    return { success: true }
  } catch (error) {
    console.error("Disable two-factor error:", error)
    return { error: "Terjadi kesalahan saat menonaktifkan autentikasi dua faktor" }
  }
}

export async function setupEncryption() {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mengatur enkripsi" }
  }

  try {
    // Generate key pair
    const { publicKey, privateKey } = await generateKeyPair()

    // Save the public key to the user's profile
    await updateUser(user.id, {
      publicKey,
      encryptionEnabled: true,
    })

    // Return the private key to the client (to be stored securely)
    return { success: true, privateKey }
  } catch (error) {
    console.error("Setup encryption error:", error)
    return { error: "Terjadi kesalahan saat mengatur enkripsi" }
  }
}

export async function disableEncryption() {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk menonaktifkan enkripsi" }
  }

  try {
    // Disable encryption for the user
    await updateUser(user.id, {
      encryptionEnabled: false,
      publicKey: null,
    })

    // Revalidate the security page
    revalidatePath("/profile/security")

    return { success: true }
  } catch (error) {
    console.error("Disable encryption error:", error)
    return { error: "Terjadi kesalahan saat menonaktifkan enkripsi" }
  }
}

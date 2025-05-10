"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createUser, getUserByEmail, getUserById } from "@/lib/models/user"
import { generateJwt, verifyJwt } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email dan password diperlukan" }
  }

  try {
    const user = await getUserByEmail(email)

    if (!user) {
      return { error: "Email atau password salah" }
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || "")

    if (!passwordMatch) {
      return { error: "Email atau password salah" }
    }

    // Buat token JWT
    const token = await generateJwt({ userId: user.id })

    // Simpan token di cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 minggu
      sameSite: "lax",
    })

    return { success: true, user }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "Terjadi kesalahan saat login" }
  }
}

export async function signupUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  if (!email || !password || !fullName) {
    return { error: "Semua kolom harus diisi" }
  }

  try {
    // Periksa apakah email sudah digunakan
    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      return { error: "Email sudah digunakan" }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Buat user baru
    const newUser = await createUser({
      email,
      passwordHash,
      fullName,
      provider: "email",
    })

    // Buat token JWT
    const token = await generateJwt({ userId: newUser.id })

    // Simpan token di cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 minggu
      sameSite: "lax",
    })

    return { success: true, user: newUser }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Terjadi kesalahan saat mendaftar" }
  }
}

export async function logoutUser() {
  cookies().delete("auth-token")
  redirect("/auth/login")
}

export async function getUser() {
  const token = cookies().get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyJwt(token)

    if (!payload || !payload.userId) {
      return null
    }

    const user = await getUserById(payload.userId)
    return user
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

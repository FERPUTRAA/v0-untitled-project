import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { getUserByEmail, verifyPassword, createUser, updateLastOnline, getUserById } from "./models/user"
import type { User } from "./models/user"
import { OAuth2Client } from "google-auth-library"

// Secret untuk JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

// Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/auth/google/callback`
      : "http://localhost:3000/auth/google/callback"),
)

// Fungsi untuk membuat token JWT
export async function signJwt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

// Fungsi untuk membuat token JWT dengan opsi
export async function generateJwt(payload: any, options: any = {}) {
  const signJWT = new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt()

  if (options.expiresIn) {
    signJWT.setExpirationTime(options.expiresIn)
  }

  return signJWT.sign(JWT_SECRET)
}

// Fungsi untuk memverifikasi token JWT
export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}

// Fungsi untuk login
export async function login(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user) {
    return { error: "User not found" }
  }

  const isValid = await verifyPassword(user, password)
  if (!isValid) {
    return { error: "Invalid password" }
  }

  // Update last online
  await updateLastOnline(user.id)

  // Buat token
  const token = await signJwt({ userId: user.id })

  // Simpan token di cookie
  cookies().set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return { user }
}

// Fungsi untuk signup
export async function signup(email: string, password: string, fullName: string) {
  // Periksa apakah email sudah digunakan
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { error: "Email already in use" }
  }

  // Buat emoji acak untuk avatar
  const emojis = ["😀", "😎", "🤩", "🥳", "😊", "🤗", "🦄", "🐱", "🐶", "🦊"]
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]

  // Buat user baru
  const user = await createUser({
    email,
    password,
    fullName,
    username: email.split("@")[0],
    avatarEmoji: randomEmoji,
    shareLocation: false,
  })

  // Buat token
  const token = await signJwt({ userId: user.id })

  // Simpan token di cookie
  cookies().set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return { user }
}

// Fungsi untuk login dengan Google
export async function loginWithGoogle(code: string) {
  try {
    // Tukar kode dengan token
    const { tokens } = await googleClient.getToken(code)

    // Verifikasi token ID
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return { error: "Invalid Google token" }
    }

    // Periksa apakah pengguna sudah ada
    let user = await getUserByEmail(payload.email)

    if (!user) {
      // Buat pengguna baru jika belum ada
      const emojis = ["😀", "😎", "🤩", "🥳", "😊", "🤗", "🦄", "🐱", "🐶", "🦊"]
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]

      user = await createUser({
        email: payload.email,
        password: "", // Tidak perlu password untuk login Google
        fullName: payload.name || payload.email.split("@")[0],
        username: payload.email.split("@")[0],
        avatarEmoji: randomEmoji,
        shareLocation: false,
      })
    }

    // Update last online
    await updateLastOnline(user.id)

    // Buat token
    const token = await signJwt({ userId: user.id })

    // Simpan token di cookie
    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return { user }
  } catch (error) {
    console.error("Google login error:", error)
    return { error: "Failed to authenticate with Google" }
  }
}

// Fungsi untuk logout
export async function logout() {
  cookies().delete("auth-token")
}

// Fungsi untuk mendapatkan user saat ini
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get("auth-token")?.value
  if (!token) return null

  const payload = await verifyJwt(token)
  if (!payload || !payload.userId) return null

  const user = await getUserById(payload.userId as string)
  if (!user) return null

  // Update last online
  await updateLastOnline(payload.userId as string)

  return user
}

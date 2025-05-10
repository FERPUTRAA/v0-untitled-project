import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { getUserByEmail, createUser, getUserById, updateUser } from "./models/user"
import { Redis } from "@upstash/redis"

// Inisialisasi Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Fungsi untuk menghasilkan JWT
export async function generateJwt(payload: any) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  return token
}

// Fungsi untuk memverifikasi JWT
export async function verifyJwt(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// Fungsi untuk login dengan Google
export async function loginWithGoogle(code: string) {
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error("Google token exchange error:", errorData)
      return { error: "Failed to exchange code for tokens" }
    }

    const tokenData = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json()
      console.error("Google user info error:", errorData)
      return { error: "Failed to get user info from Google" }
    }

    const userData = await userInfoResponse.json()

    // Check if user exists
    let user = await getUserByEmail(userData.email)

    if (!user) {
      // Create new user
      user = await createUser({
        email: userData.email,
        fullName: userData.name,
        avatarUrl: userData.picture,
        provider: "google",
        googleId: userData.id,
      })
    } else if (user.provider !== "google") {
      // Update existing user with Google info
      user = await updateUser(user.id, {
        googleId: userData.id,
        avatarUrl: user.avatarUrl || userData.picture,
      })
    }

    // Generate JWT
    const token = await generateJwt({ userId: user.id })

    // Set cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    })

    return { user }
  } catch (error) {
    console.error("Google login error:", error)
    return { error: "An error occurred during Google login" }
  }
}

// Fungsi untuk mendapatkan user dari token
export async function getUserFromToken() {
  const token = cookies().get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyJwt(token)

    if (!payload || !payload.userId) {
      return null
    }

    const user = await getUserById(payload.userId as string)
    return user
  } catch (error) {
    console.error("Get user from token error:", error)
    return null
  }
}

// Fungsi untuk update last online
export async function updateLastOnline(userId: string) {
  try {
    await updateUser(userId, {
      lastOnline: new Date().toISOString(),
    })

    // Simpan status online di Redis
    await redis.set(`online:${userId}`, true, { ex: 300 }) // 5 menit
  } catch (error) {
    console.error("Update last online error:", error)
  }
}

// Fungsi untuk cek apakah user online
export async function isUserOnline(userId: string) {
  try {
    const online = await redis.get(`online:${userId}`)
    return !!online
  } catch (error) {
    console.error("Check user online error:", error)
    return false
  }
}

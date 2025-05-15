import { Redis } from "@upstash/redis"
import { v4 as uuidv4 } from "uuid"

// Inisialisasi Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Tipe data User
export type User = {
  id: string
  email: string
  fullName: string
  username?: string
  avatarEmoji?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  lastOnline?: string
  location?: string
  bio?: string
  age?: number
  gender?: string
  shareLocation?: boolean
  hashedPassword?: string
  provider?: string
  googleId?: string
}

// Fungsi untuk membuat ID unik
export function generateId(): string {
  return uuidv4()
}

// Fungsi untuk mendapatkan timestamp saat ini
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Fungsi untuk membuat user baru
export async function createUser(userData: {
  email: string
  fullName: string
  avatarEmoji?: string
  avatarUrl?: string
  password?: string
  provider?: string
  googleId?: string
}): Promise<User> {
  try {
    const id = generateId()
    const now = getCurrentTimestamp()

    const user: User = {
      id,
      email: userData.email,
      fullName: userData.fullName,
      username: userData.email.split("@")[0],
      avatarEmoji: userData.avatarEmoji || "😊",
      avatarUrl: userData.avatarUrl,
      createdAt: now,
      updatedAt: now,
      lastOnline: now,
      shareLocation: false,
      provider: userData.provider || "email",
      googleId: userData.googleId,
    }

    if (userData.password) {
      // Dalam aplikasi nyata, gunakan bcrypt atau argon2
      user.hashedPassword = Buffer.from(userData.password).toString("base64")
    }

    // Simpan user di Redis
    console.log("Saving user to Redis:", id)
    const saveResult = await redis.hset(`user:${id}`, user)
    console.log("Save result:", saveResult)

    // Simpan referensi email ke id
    console.log("Saving email reference:", userData.email.toLowerCase())
    const emailResult = await redis.set(`email:${userData.email.toLowerCase()}`, id)
    console.log("Email reference result:", emailResult)

    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

// Fungsi untuk mendapatkan user berdasarkan ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log("Getting user by ID:", id)
    const user = await redis.hgetall(`user:${id}`)
    console.log("User data from Redis:", user ? "Found" : "Not found")
    return user ? (user as unknown as User) : null
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Fungsi untuk mendapatkan user berdasarkan email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("Getting user by email:", email)
    const userId = await redis.get(`email:${email.toLowerCase()}`)
    console.log("User ID from email:", userId || "Not found")

    if (!userId) return null

    return getUserById(userId as string)
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Fungsi untuk memperbarui user
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    console.log("Updating user:", id)
    const user = await getUserById(id)
    if (!user) {
      console.log("User not found for update")
      return null
    }

    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: getCurrentTimestamp(),
    }

    console.log("Saving updated user to Redis")
    await redis.hset(`user:${id}`, updatedUser)

    return updatedUser
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

// Fungsi untuk memverifikasi password
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.hashedPassword) return false

  // Dalam aplikasi nyata, gunakan bcrypt atau argon2
  const hashedInput = Buffer.from(password).toString("base64")
  return user.hashedPassword === hashedInput
}

// Fungsi untuk mendapatkan pengguna terdekat
export async function getNearbyUsers(userId: string, limit = 10): Promise<User[]> {
  try {
    // Dapatkan semua kunci user
    console.log("Getting nearby users for:", userId)
    const keys = await redis.keys("user:*")
    console.log("Found user keys:", keys.length)

    const users: User[] = []

    // Ambil data untuk setiap user
    for (const key of keys) {
      const id = key.replace("user:", "")
      if (id !== userId) {
        const user = await getUserById(id)
        if (user) users.push(user)
      }
    }

    console.log("Returning nearby users:", users.length)
    // Batasi jumlah hasil
    return users.slice(0, limit)
  } catch (error) {
    console.error("Error getting nearby users:", error)
    return []
  }
}

// Fungsi untuk mencari pengguna berdasarkan nama atau email
export async function searchUsers(query: string, currentUserId: string): Promise<User[]> {
  try {
    // Dapatkan semua kunci user
    console.log("Searching users with query:", query)
    const keys = await redis.keys("user:*")
    const users: User[] = []

    // Ambil data untuk setiap user
    for (const key of keys) {
      const id = key.replace("user:", "")
      if (id !== currentUserId) {
        const user = await getUserById(id)
        if (user) {
          // Cari berdasarkan nama, username, atau email
          const fullNameMatch = user.fullName.toLowerCase().includes(query.toLowerCase())
          const usernameMatch = user.username?.toLowerCase().includes(query.toLowerCase())
          const emailMatch = user.email.toLowerCase().includes(query.toLowerCase())

          if (fullNameMatch || usernameMatch || emailMatch) {
            users.push(user)
          }
        }
      }
    }

    console.log("Search results:", users.length)
    return users
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

// Fungsi untuk menghapus user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    console.log("Deleting user:", id)
    const user = await getUserById(id)
    if (!user) {
      console.log("User not found for deletion")
      return false
    }

    // Hapus referensi email
    await redis.del(`email:${user.email.toLowerCase()}`)

    // Hapus user
    await redis.del(`user:${id}`)

    console.log("User deleted successfully")
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Alias untuk kompatibilitas
export const getCurrentUserProfile = getUserById
export const getUserProfile = getUserById

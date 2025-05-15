import { Redis } from "@upstash/redis"

// Konstanta untuk key Redis
export const KEYS = {
  USER: "user:",
  EMAIL: "email:",
  CHAT: "chat:",
  MESSAGE: "message:",
  INBOX: "inbox:",
  ONLINE: "online:",
  CALL: "call:",
}

// Inisialisasi Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Fungsi untuk memeriksa koneksi Redis
export async function checkRedisConnection(): Promise<boolean> {
  try {
    // Coba set dan get nilai untuk memeriksa koneksi
    const testKey = "connection:test"
    const testValue = "connected-" + Date.now()

    await redis.set(testKey, testValue)
    const result = await redis.get(testKey)
    await redis.del(testKey)

    return result === testValue
  } catch (error) {
    console.error("Redis connection error:", error)
    return false
  }
}

// Fungsi untuk membuat ID unik
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Fungsi untuk mendapatkan timestamp saat ini
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Fungsi untuk membersihkan database (hanya untuk pengujian)
export async function clearDatabase(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Cannot clear database in production")
  }

  try {
    const keys = await redis.keys("*")
    for (const key of keys) {
      await redis.del(key)
    }
  } catch (error) {
    console.error("Error clearing database:", error)
    throw error
  }
}

import { Redis } from "@upstash/redis"

// Konstanta untuk key Redis
export const KEYS = {
  USER: "user:",
  EMAIL: "email:",
  CHAT: "chat:",
  MESSAGE: "message:",
  ONLINE: "online:",
  CALL: "call:",
}

// Inisialisasi Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Fungsi untuk membuat ID unik
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Fungsi untuk mendapatkan timestamp saat ini
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

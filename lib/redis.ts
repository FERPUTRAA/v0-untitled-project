import { Redis } from "@upstash/redis"

// Inisialisasi klien Redis
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Fungsi helper untuk menghasilkan ID unik
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Fungsi helper untuk mendapatkan timestamp saat ini
export function getCurrentTimestamp() {
  return new Date().toISOString()
}

// Prefix untuk key Redis
export const KEYS = {
  USER: "user:",
  USER_BY_EMAIL: "user_by_email:",
  USER_SESSION: "user_session:",
  USER_SECURITY: "user_security:",
  MESSAGE: "message:",
  MESSAGES_BETWEEN: "messages_between:",
  FRIENDSHIP: "friendship:",
  FRIENDSHIPS_FOR_USER: "friendships_for_user:",
  FRIEND_REQUESTS: "friend_requests:",
  CALL: "call:",
  CALLS_FOR_USER: "calls_for_user:",
}

import { Redis } from "@upstash/redis"
import { v4 as uuidv4 } from "uuid"

// Inisialisasi Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Tipe data Message
export type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  encrypted?: boolean
}

// Fungsi untuk membuat ID unik
function generateId(): string {
  return uuidv4()
}

// Fungsi untuk mendapatkan timestamp saat ini
function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// Fungsi untuk mengirim pesan
export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
  encrypted = false,
): Promise<Message> {
  try {
    console.log(`Sending message from ${senderId} to ${receiverId}`)
    const id = generateId()
    const timestamp = getCurrentTimestamp()

    const message: Message = {
      id,
      senderId,
      receiverId,
      content,
      timestamp,
      read: false,
      encrypted,
    }

    // Simpan pesan di Redis
    await redis.hset(`message:${id}`, message)

    // Tambahkan ke sorted set untuk kedua pengguna
    const score = new Date(timestamp).getTime()

    // Sorted set untuk pesan antara dua pengguna (untuk riwayat chat)
    const chatKey = `chat:${[senderId, receiverId].sort().join(":")}`
    await redis.zadd(chatKey, { score, member: id })

    // Sorted set untuk pesan masuk pengguna (untuk notifikasi)
    await redis.zadd(`inbox:${receiverId}`, { score, member: id })

    console.log(`Message sent successfully with ID: ${id}`)
    return message
  } catch (error) {
    console.error("Error sending message:", error)
    throw new Error("Failed to send message")
  }
}

// Fungsi untuk mendapatkan pesan berdasarkan ID
export async function getMessageById(id: string): Promise<Message | null> {
  try {
    const message = await redis.hgetall(`message:${id}`)
    return message ? (message as unknown as Message) : null
  } catch (error) {
    console.error("Error getting message by ID:", error)
    return null
  }
}

// Fungsi untuk mendapatkan pesan antara dua pengguna
export async function getMessagesBetweenUsers(
  userId1: string,
  userId2: string,
  limit = 50,
  offset = 0,
): Promise<Message[]> {
  try {
    console.log(`Getting messages between ${userId1} and ${userId2}`)
    const chatKey = `chat:${[userId1, userId2].sort().join(":")}`

    // Dapatkan ID pesan dari sorted set, dari yang terbaru ke yang terlama
    const messageIds = await redis.zrange(chatKey, offset, offset + limit - 1, {
      rev: true, // Reverse order (newest first)
    })

    console.log(`Found ${messageIds.length} message IDs`)

    // Dapatkan detail pesan untuk setiap ID
    const messages: Message[] = []
    for (const id of messageIds) {
      const message = await getMessageById(id as string)
      if (message) messages.push(message)
    }

    // Tandai pesan sebagai dibaca jika pengguna saat ini adalah penerima
    for (const message of messages) {
      if (message.receiverId === userId1 && !message.read) {
        await markMessageAsRead(message.id)
        message.read = true
      }
    }

    return messages
  } catch (error) {
    console.error("Error getting messages between users:", error)
    return []
  }
}

// Fungsi untuk menandai pesan sebagai dibaca
export async function markMessageAsRead(id: string): Promise<boolean> {
  try {
    const message = await getMessageById(id)
    if (!message) return false

    await redis.hset(`message:${id}`, { read: true })
    return true
  } catch (error) {
    console.error("Error marking message as read:", error)
    return false
  }
}

// Fungsi untuk mendapatkan jumlah pesan yang belum dibaca
export async function getUnreadMessageCount(userId: string): Promise<number> {
  try {
    // Dapatkan semua pesan di inbox pengguna
    const inboxKey = `inbox:${userId}`
    const messageIds = await redis.zrange(inboxKey, 0, -1)

    let unreadCount = 0
    for (const id of messageIds) {
      const message = await getMessageById(id as string)
      if (message && !message.read && message.receiverId === userId) {
        unreadCount++
      }
    }

    return unreadCount
  } catch (error) {
    console.error("Error getting unread message count:", error)
    return 0
  }
}

// Fungsi untuk menghapus pesan
export async function deleteMessage(id: string): Promise<boolean> {
  try {
    const message = await getMessageById(id)
    if (!message) return false

    // Hapus pesan dari Redis
    await redis.del(`message:${id}`)

    // Hapus dari sorted set
    const chatKey = `chat:${[message.senderId, message.receiverId].sort().join(":")}`
    await redis.zrem(chatKey, id)

    // Hapus dari inbox penerima
    await redis.zrem(`inbox:${message.receiverId}`, id)

    return true
  } catch (error) {
    console.error("Error deleting message:", error)
    return false
  }
}

// Alias untuk kompatibilitas
export const createMessage = sendMessage
export const getMessagesByConversationId = getMessagesBetweenUsers

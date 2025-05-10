import { redis, KEYS, generateId, getCurrentTimestamp } from "../redis"

export type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  read: boolean
  encrypted: boolean
  mediaType?: string
  mediaUrl?: string
}

export async function sendMessage(messageData: Omit<Message, "id" | "createdAt">): Promise<Message> {
  const id = generateId()
  const now = getCurrentTimestamp()

  const message: Message = {
    id,
    senderId: messageData.senderId,
    receiverId: messageData.receiverId,
    content: messageData.content,
    createdAt: now,
    read: messageData.read || false,
    encrypted: messageData.encrypted || true,
    mediaType: messageData.mediaType,
    mediaUrl: messageData.mediaUrl,
  }

  // Simpan pesan di Redis
  await redis.hset(`${KEYS.MESSAGE}${id}`, message)

  // Tambahkan ID pesan ke daftar pesan antara dua pengguna
  // Kita menyimpan daftar pesan dalam urutan yang sama terlepas dari siapa pengirim/penerima
  const userIds = [messageData.senderId, messageData.receiverId].sort()
  await redis.zadd(`${KEYS.MESSAGES_BETWEEN}${userIds[0]}:${userIds[1]}`, {
    score: Date.now(),
    member: id,
  })

  return message
}

export async function getMessageById(id: string): Promise<Message | null> {
  const message = await redis.hgetall(`${KEYS.MESSAGE}${id}`)
  return (message as Message) || null
}

export async function getMessagesBetweenUsers(userId1: string, userId2: string, limit = 50): Promise<Message[]> {
  const userIds = [userId1, userId2].sort()
  const messageIds = await redis.zrange(`${KEYS.MESSAGES_BETWEEN}${userIds[0]}:${userIds[1]}`, 0, limit - 1, {
    rev: true,
  })

  const messages: Message[] = []
  for (const id of messageIds) {
    const message = await getMessageById(id as string)
    if (message) messages.push(message)
  }

  // Tandai pesan yang belum dibaca sebagai dibaca
  for (const message of messages) {
    if (message.receiverId === userId1 && !message.read) {
      await redis.hset(`${KEYS.MESSAGE}${message.id}`, { read: true })
      message.read = true
    }
  }

  return messages.reverse() // Kembalikan dalam urutan kronologis
}

export async function getChatList(userId: string): Promise<any[]> {
  // Dapatkan semua kunci pesan yang melibatkan pengguna ini
  const keys = await redis.keys(`${KEYS.MESSAGES_BETWEEN}${userId}:*`)
  const moreKeys = await redis.keys(`${KEYS.MESSAGES_BETWEEN}*:${userId}`)

  const allKeys = [...keys, ...moreKeys]
  const chatList = []

  for (const key of allKeys) {
    // Ekstrak ID pengguna lain dari kunci
    const parts = key.replace(`${KEYS.MESSAGES_BETWEEN}`, "").split(":")
    const otherUserId = parts[0] === userId ? parts[1] : parts[0]

    // Dapatkan pesan terakhir
    const messageIds = await redis.zrange(key, 0, 0, { rev: true })
    if (messageIds.length === 0) continue

    const lastMessage = await getMessageById(messageIds[0] as string)
    if (!lastMessage) continue

    // Dapatkan informasi pengguna lain
    const otherUser = await redis.hgetall(`${KEYS.USER}${otherUserId}`)
    if (!otherUser) continue

    // Hitung jumlah pesan yang belum dibaca
    const unreadCount = await countUnreadMessages(otherUserId, userId)

    chatList.push({
      contactId: otherUserId,
      contactName: otherUser.fullName,
      contactAvatar: otherUser.avatarEmoji,
      lastMessage: lastMessage.content,
      lastMessageTime: lastMessage.createdAt,
      unreadCount,
    })
  }

  // Urutkan berdasarkan waktu pesan terakhir
  return chatList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
}

export async function countUnreadMessages(senderId: string, receiverId: string): Promise<number> {
  const userIds = [senderId, receiverId].sort()
  const messageIds = await redis.zrange(`${KEYS.MESSAGES_BETWEEN}${userIds[0]}:${userIds[1]}`, 0, -1)

  let count = 0
  for (const id of messageIds) {
    const message = await getMessageById(id as string)
    if (message && message.senderId === senderId && message.receiverId === receiverId && !message.read) {
      count++
    }
  }

  return count
}

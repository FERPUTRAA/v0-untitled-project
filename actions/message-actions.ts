"use server"

import { getCurrentUser } from "@/lib/auth"
import { sendMessage, getMessagesBetweenUsers, getChatList, countUnreadMessages } from "@/lib/models/message"
import { revalidatePath } from "next/cache"

// Fungsi untuk mendapatkan daftar chat
export async function getChatListForCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const chats = await getChatList(user.id)
  return { data: chats }
}

// Fungsi untuk mendapatkan pesan dalam chat
export async function getChatMessagesWithUser(otherUserId: string, limit = 50) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const messages = await getMessagesBetweenUsers(user.id, otherUserId, limit)
  return { data: messages }
}

// Fungsi untuk mengirim pesan
export async function sendMessageToUser(
  receiverId: string,
  content: string,
  encrypted = true,
  mediaType = null,
  mediaUrl = null,
) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const message = await sendMessage({
    senderId: user.id,
    receiverId,
    content,
    read: false,
    encrypted,
    mediaType,
    mediaUrl,
  })

  revalidatePath(`/chats/${receiverId}`)
  return { data: message }
}

// Fungsi untuk mendapatkan jumlah pesan yang belum dibaca
export async function getUnreadMessageCountFromUser(senderId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const count = await countUnreadMessages(senderId, user.id)
  return { count }
}

// Fungsi untuk mendapatkan total jumlah pesan yang belum dibaca
export async function getTotalUnreadMessageCount() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const chats = await getChatList(user.id)
  const totalUnread = chats.reduce((total, chat) => total + chat.unreadCount, 0)

  return { count: totalUnread }
}

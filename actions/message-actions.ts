"use server"

import { revalidatePath } from "next/cache"
import { createMessage, getMessagesByConversationId } from "@/lib/models/message"
import { getUser } from "./auth-actions"

export async function sendMessage(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mengirim pesan" }
  }

  const content = formData.get("content") as string
  const conversationId = formData.get("conversationId") as string
  const receiverId = formData.get("receiverId") as string

  if (!content || !conversationId || !receiverId) {
    return { error: "Data tidak lengkap" }
  }

  try {
    const message = await createMessage({
      senderId: user.id,
      receiverId,
      conversationId,
      content,
      type: "text",
    })

    // Revalidate the conversation page to show the new message
    revalidatePath(`/chats/${conversationId}`)

    return { success: true, message }
  } catch (error) {
    console.error("Send message error:", error)
    return { error: "Terjadi kesalahan saat mengirim pesan" }
  }
}

export async function getMessages(conversationId: string) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk melihat pesan" }
  }

  try {
    const messages = await getMessagesByConversationId(conversationId)
    return { success: true, messages }
  } catch (error) {
    console.error("Get messages error:", error)
    return { error: "Terjadi kesalahan saat mengambil pesan" }
  }
}

"use server"
import { createCall, updateCall, getCallById } from "@/lib/models/call"
import { getUser } from "./auth-actions"

export async function initiateCall(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk melakukan panggilan" }
  }

  const receiverId = formData.get("receiverId") as string

  if (!receiverId) {
    return { error: "Penerima panggilan tidak ditemukan" }
  }

  try {
    const call = await createCall({
      callerId: user.id,
      receiverId,
      status: "initiated",
    })

    return { success: true, call }
  } catch (error) {
    console.error("Initiate call error:", error)
    return { error: "Terjadi kesalahan saat memulai panggilan" }
  }
}

export async function answerCall(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk menjawab panggilan" }
  }

  const callId = formData.get("callId") as string

  if (!callId) {
    return { error: "ID panggilan tidak ditemukan" }
  }

  try {
    const call = await getCallById(callId)

    if (!call) {
      return { error: "Panggilan tidak ditemukan" }
    }

    if (call.receiverId !== user.id) {
      return { error: "Anda tidak berhak menjawab panggilan ini" }
    }

    const updatedCall = await updateCall(callId, {
      status: "answered",
      answeredAt: new Date().toISOString(),
    })

    return { success: true, call: updatedCall }
  } catch (error) {
    console.error("Answer call error:", error)
    return { error: "Terjadi kesalahan saat menjawab panggilan" }
  }
}

export async function endCall(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mengakhiri panggilan" }
  }

  const callId = formData.get("callId") as string

  if (!callId) {
    return { error: "ID panggilan tidak ditemukan" }
  }

  try {
    const call = await getCallById(callId)

    if (!call) {
      return { error: "Panggilan tidak ditemukan" }
    }

    if (call.callerId !== user.id && call.receiverId !== user.id) {
      return { error: "Anda tidak berhak mengakhiri panggilan ini" }
    }

    const updatedCall = await updateCall(callId, {
      status: "ended",
      endedAt: new Date().toISOString(),
    })

    return { success: true, call: updatedCall }
  } catch (error) {
    console.error("End call error:", error)
    return { error: "Terjadi kesalahan saat mengakhiri panggilan" }
  }
}

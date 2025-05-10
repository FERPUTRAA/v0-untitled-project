"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  startCall,
  answerCall as answerCallModel,
  rejectCall as rejectCallModel,
  endCall as endCallModel,
} from "@/lib/models/call"

// Fungsi untuk memulai panggilan
export async function startCallWithUser(receiverId: string, callType: "audio" | "video") {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const call = await startCall(user.id, receiverId, callType)
  return { data: call }
}

// Fungsi untuk menjawab panggilan
export async function answerCallAction(callId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const call = await answerCallModel(callId)
  return { data: call }
}

// Fungsi untuk menolak panggilan
export async function rejectCallAction(callId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const call = await rejectCallModel(callId)
  return { data: call }
}

// Fungsi untuk mengakhiri panggilan
export async function endCallAction(callId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const call = await endCallModel(callId)
  return { data: call }
}

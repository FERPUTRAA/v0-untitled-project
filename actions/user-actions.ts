"\"use server"

import { getCurrentUser } from "@/lib/auth"
import { updateUser, getNearbyUsers, getUserById as getUserByIdModel } from "@/lib/models/user"
import { getFriendsList, getFriendRequests, sendFriendRequest, respondToFriendRequest } from "@/lib/models/friendship"
import { getCallHistory } from "@/lib/models/call"
import { revalidatePath } from "next/cache"

// Fungsi untuk mendapatkan profil pengguna saat ini
export async function getCurrentUserProfile() {
  return getCurrentUser()
}

// Fungsi untuk memperbarui profil pengguna
export async function updateUserProfile(userData: any) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const updatedUser = await updateUser(user.id, userData)
  revalidatePath("/profile")

  return { data: updatedUser }
}

// Fungsi untuk mendapatkan pengguna terdekat
export async function getNearbyUsersList(limit = 10) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const nearbyUsers = await getNearbyUsers(user.id, limit)
  return { data: nearbyUsers }
}

// Fungsi untuk mendapatkan daftar teman
export async function getFriendsListForCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const friends = await getFriendsList(user.id)
  return { data: friends }
}

// Fungsi untuk mendapatkan permintaan pertemanan
export async function getFriendRequestsForCurrentUser() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const requests = await getFriendRequests(user.id)
  return { data: requests }
}

// Fungsi untuk mengirim permintaan pertemanan
export async function sendFriendRequestToUser(friendId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    await sendFriendRequest(user.id, friendId)
    revalidatePath("/dashboard/nearby")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Fungsi untuk menerima/menolak permintaan pertemanan
export async function respondToFriendRequestAction(requestId: string, status: "accepted" | "rejected") {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const result = await respondToFriendRequest(requestId, status)
  revalidatePath("/dashboard/nearby")

  return { data: result }
}

// Fungsi untuk mendapatkan riwayat panggilan
export async function getCallHistoryForCurrentUser(limit = 10) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const calls = await getCallHistory(user.id, limit)
  return { data: calls }
}

// Fungsi untuk mendapatkan user by ID
export async function getUserById(userId: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const profile = await getUserByIdModel(userId)
  return profile
}

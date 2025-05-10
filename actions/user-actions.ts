"use server"

import { revalidatePath } from "next/cache"
import { updateUser, getUserById as getUserByIdModel, searchUsers, getNearbyUsers } from "@/lib/models/user"
import { getFriendsList, getFriendRequests, sendFriendRequest, respondToFriendRequest } from "@/lib/models/friendship"
import { getCallHistory } from "@/lib/models/call"
import { getUser } from "./auth-actions"

export async function updateProfile(formData: FormData) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk memperbarui profil" }
  }

  const fullName = formData.get("fullName") as string
  const bio = formData.get("bio") as string
  const avatarUrl = formData.get("avatarUrl") as string

  try {
    const updatedUser = await updateUser(user.id, {
      fullName: fullName || user.fullName,
      bio: bio || user.bio,
      avatarUrl: avatarUrl || user.avatarUrl,
    })

    // Revalidate the profile page to show the updated information
    revalidatePath("/profile")

    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Terjadi kesalahan saat memperbarui profil" }
  }
}

// Alias untuk updateProfile untuk kompatibilitas dengan kode yang ada
export const updateUserProfile = updateProfile

export async function getUserProfile(userId: string) {
  const currentUser = await getUser()

  if (!currentUser) {
    return { error: "Anda harus login untuk melihat profil" }
  }

  try {
    const userProfile = await getUserByIdModel(userId)

    if (!userProfile) {
      return { error: "Pengguna tidak ditemukan" }
    }

    return { success: true, user: userProfile }
  } catch (error) {
    console.error("Get user profile error:", error)
    return { error: "Terjadi kesalahan saat mengambil profil pengguna" }
  }
}

// Fungsi untuk mendapatkan profil pengguna saat ini
export async function getCurrentUserProfile() {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  return { success: true, user }
}

// Fungsi untuk mendapatkan pengguna berdasarkan ID
export async function getUserById(userId: string) {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const profile = await getUserByIdModel(userId)
  return { success: !!profile, user: profile }
}

// Fungsi untuk mendapatkan pengguna terdekat
export async function getNearbyUsersList(limit = 10) {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const nearbyUsers = await getNearbyUsers(user.id, limit)
  return { success: true, users: nearbyUsers }
}

export async function searchForUsers(query: string) {
  const user = await getUser()

  if (!user) {
    return { error: "Anda harus login untuk mencari pengguna" }
  }

  if (!query || query.length < 2) {
    return { error: "Kata kunci pencarian terlalu pendek" }
  }

  try {
    const users = await searchUsers(query, user.id)
    return { success: true, users }
  } catch (error) {
    console.error("Search users error:", error)
    return { error: "Terjadi kesalahan saat mencari pengguna" }
  }
}

// Fungsi untuk mendapatkan daftar teman
export async function getFriendsListForCurrentUser() {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const friends = await getFriendsList(user.id)
  return { success: true, friends }
}

// Fungsi untuk mendapatkan permintaan pertemanan
export async function getFriendRequestsForCurrentUser() {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const requests = await getFriendRequests(user.id)
  return { success: true, requests }
}

// Fungsi untuk mengirim permintaan pertemanan
export async function sendFriendRequestToUser(friendId: string) {
  const user = await getUser()
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
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const result = await respondToFriendRequest(requestId, status)
  revalidatePath("/dashboard/nearby")

  return { success: true, result }
}

// Fungsi untuk mendapatkan riwayat panggilan
export async function getCallHistoryForCurrentUser(limit = 10) {
  const user = await getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const calls = await getCallHistory(user.id, limit)
  return { success: true, calls }
}

import { redis, KEYS, generateId, getCurrentTimestamp } from "../redis"
import { getUserById } from "./user"

export type Friendship = {
  id: string
  userId: string
  friendId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  updatedAt: string
}

export async function sendFriendRequest(userId: string, friendId: string): Promise<Friendship> {
  // Periksa apakah permintaan sudah ada
  const existingFriendship = await getFriendshipBetweenUsers(userId, friendId)
  if (existingFriendship) {
    throw new Error("Permintaan pertemanan sudah ada")
  }

  const id = generateId()
  const now = getCurrentTimestamp()

  const friendship: Friendship = {
    id,
    userId,
    friendId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }

  // Simpan pertemanan di Redis
  await redis.hset(`${KEYS.FRIENDSHIP}${id}`, friendship)

  // Tambahkan ke daftar pertemanan pengguna
  await redis.sadd(`${KEYS.FRIENDSHIPS_FOR_USER}${userId}`, id)
  await redis.sadd(`${KEYS.FRIENDSHIPS_FOR_USER}${friendId}`, id)

  // Tambahkan ke daftar permintaan pertemanan
  await redis.sadd(`${KEYS.FRIEND_REQUESTS}${friendId}`, id)

  return friendship
}

export async function getFriendshipById(id: string): Promise<Friendship | null> {
  const friendship = await redis.hgetall(`${KEYS.FRIENDSHIP}${id}`)
  return (friendship as Friendship) || null
}

export async function getFriendshipBetweenUsers(userId1: string, userId2: string): Promise<Friendship | null> {
  // Dapatkan semua pertemanan untuk userId1
  const friendshipIds = await redis.smembers(`${KEYS.FRIENDSHIPS_FOR_USER}${userId1}`)

  for (const id of friendshipIds) {
    const friendship = await getFriendshipById(id as string)
    if (
      friendship &&
      ((friendship.userId === userId1 && friendship.friendId === userId2) ||
        (friendship.userId === userId2 && friendship.friendId === userId1))
    ) {
      return friendship
    }
  }

  return null
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: "accepted" | "rejected",
): Promise<Friendship | null> {
  const friendship = await getFriendshipById(friendshipId)
  if (!friendship) return null

  const updatedFriendship = {
    ...friendship,
    status,
    updatedAt: getCurrentTimestamp(),
  }

  await redis.hset(`${KEYS.FRIENDSHIP}${friendshipId}`, updatedFriendship)

  // Hapus dari daftar permintaan pertemanan
  await redis.srem(`${KEYS.FRIEND_REQUESTS}${friendship.friendId}`, friendshipId)

  return updatedFriendship
}

export async function getFriendsList(userId: string): Promise<any[]> {
  const friendshipIds = await redis.smembers(`${KEYS.FRIENDSHIPS_FOR_USER}${userId}`)
  const friends = []

  for (const id of friendshipIds) {
    const friendship = await getFriendshipById(id as string)
    if (friendship && friendship.status === "accepted") {
      const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId
      const friend = await getUserById(friendId)

      if (friend) {
        friends.push({
          id: friendship.id,
          friend,
        })
      }
    }
  }

  return friends
}

export async function getFriendRequests(userId: string): Promise<any[]> {
  const requestIds = await redis.smembers(`${KEYS.FRIEND_REQUESTS}${userId}`)
  const requests = []

  for (const id of requestIds) {
    const friendship = await getFriendshipById(id as string)
    if (friendship && friendship.status === "pending") {
      const user = await getUserById(friendship.userId)

      if (user) {
        requests.push({
          id: friendship.id,
          user,
        })
      }
    }
  }

  return requests
}

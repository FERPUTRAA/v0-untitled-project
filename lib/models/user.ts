import { redis, KEYS, generateId, getCurrentTimestamp } from "../redis"

export type User = {
  id: string
  email: string
  fullName: string
  username: string
  avatarEmoji: string
  createdAt: string
  updatedAt: string
  lastOnline: string
  location?: string
  bio?: string
  age?: number
  gender?: string
  shareLocation: boolean
  lastProfileChange?: string
  hashedPassword?: string
}

export async function createUser(
  userData: Omit<User, "id" | "createdAt" | "updatedAt" | "lastOnline"> & { password?: string },
): Promise<User> {
  const id = generateId()
  const now = getCurrentTimestamp()

  const user: User = {
    id,
    email: userData.email,
    fullName: userData.fullName,
    username: userData.username || userData.email.split("@")[0],
    avatarEmoji: userData.avatarEmoji,
    createdAt: now,
    updatedAt: now,
    lastOnline: now,
    location: userData.location,
    bio: userData.bio,
    age: userData.age,
    gender: userData.gender,
    shareLocation: userData.shareLocation || false,
    lastProfileChange: userData.lastProfileChange,
    hashedPassword: userData.password ? await hashPassword(userData.password) : undefined,
  }

  // Simpan user di Redis
  await redis.hset(`${KEYS.USER}${id}`, user)

  // Simpan referensi email ke id
  await redis.set(`${KEYS.USER_BY_EMAIL}${userData.email.toLowerCase()}`, id)

  return user
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await redis.hgetall(`${KEYS.USER}${id}`)
  return (user as User) || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const userId = await redis.get(`${KEYS.USER_BY_EMAIL}${email.toLowerCase()}`)
  if (!userId) return null

  return getUserById(userId as string)
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const user = await getUserById(id)
  if (!user) return null

  const updatedUser = {
    ...user,
    ...userData,
    updatedAt: getCurrentTimestamp(),
  }

  await redis.hset(`${KEYS.USER}${id}`, updatedUser)

  return updatedUser
}

export async function updateLastOnline(id: string): Promise<void> {
  await redis.hset(`${KEYS.USER}${id}`, { lastOnline: getCurrentTimestamp() })
}

export async function getNearbyUsers(userId: string, limit = 10): Promise<(User & { distance: number })[]> {
  // Dapatkan semua user
  const userKeys = await redis.keys(`${KEYS.USER}*`)
  const users: User[] = []

  for (const key of userKeys) {
    const id = key.replace(KEYS.USER, "")
    if (id !== userId) {
      const user = await getUserById(id)
      if (user) users.push(user)
    }
  }

  // Batasi jumlah dan tambahkan jarak acak (untuk demo)
  return users.slice(0, limit).map((user) => ({
    ...user,
    distance: Math.round(Math.random() * 20 * 10) / 10, // Jarak acak 0-20 km
  }))
}

// Fungsi untuk hashing password
async function hashPassword(password: string): Promise<string> {
  // Dalam aplikasi nyata, gunakan bcrypt atau argon2
  // Untuk demo, kita gunakan implementasi sederhana
  return Buffer.from(password).toString("base64")
}

// Fungsi untuk verifikasi password
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.hashedPassword) return false

  // Dalam aplikasi nyata, gunakan bcrypt atau argon2
  const hashedInput = Buffer.from(password).toString("base64")
  return user.hashedPassword === hashedInput
}

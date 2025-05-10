import { redis, KEYS, getCurrentTimestamp } from "../redis"

export type UserSecurity = {
  userId: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  encryptionEnabled: boolean
  publicKey?: string
  createdAt: string
  updatedAt: string
}

export async function setupUserSecurity(
  userId: string,
  encryptionEnabled: boolean,
  publicKey?: string,
): Promise<UserSecurity> {
  // Periksa apakah pengaturan keamanan sudah ada
  const existingSecurity = await getUserSecurity(userId)
  const now = getCurrentTimestamp()

  if (existingSecurity) {
    // Perbarui pengaturan yang ada
    const updatedSecurity = {
      ...existingSecurity,
      encryptionEnabled,
      publicKey,
      updatedAt: now,
    }

    await redis.hset(`${KEYS.USER_SECURITY}${userId}`, updatedSecurity)
    return updatedSecurity
  } else {
    // Buat pengaturan baru
    const security: UserSecurity = {
      userId,
      twoFactorEnabled: false,
      encryptionEnabled,
      publicKey,
      createdAt: now,
      updatedAt: now,
    }

    await redis.hset(`${KEYS.USER_SECURITY}${userId}`, security)
    return security
  }
}

export async function setupTwoFactor(userId: string, enabled: boolean, secret?: string): Promise<UserSecurity | null> {
  const security = await getUserSecurity(userId)
  if (!security) return null

  const updatedSecurity = {
    ...security,
    twoFactorEnabled: enabled,
    twoFactorSecret: secret,
    updatedAt: getCurrentTimestamp(),
  }

  await redis.hset(`${KEYS.USER_SECURITY}${userId}`, updatedSecurity)
  return updatedSecurity
}

export async function getUserSecurity(userId: string): Promise<UserSecurity | null> {
  const security = await redis.hgetall(`${KEYS.USER_SECURITY}${userId}`)
  return (security as UserSecurity) || null
}

export async function getUserPublicKey(userId: string): Promise<string | null> {
  const security = await getUserSecurity(userId)
  return security?.publicKey || null
}

export type UserSession = {
  id: string
  userId: string
  deviceInfo: string
  ipAddress: string
  location?: string
  createdAt: string
  lastActive: string
}

export async function logUserSession(
  userId: string,
  deviceInfo: string,
  ipAddress: string,
  location?: string,
): Promise<UserSession> {
  const id = generateId()
  const now = getCurrentTimestamp()

  const session: UserSession = {
    id,
    userId,
    deviceInfo,
    ipAddress,
    location,
    createdAt: now,
    lastActive: now,
  }

  await redis.hset(`${KEYS.USER_SESSION}${id}`, session)
  await redis.sadd(`${KEYS.USER_SESSION}${userId}:sessions`, id)

  return session
}

export async function getUserSessions(userId: string): Promise<UserSession[]> {
  const sessionIds = await redis.smembers(`${KEYS.USER_SESSION}${userId}:sessions`)
  const sessions = []

  for (const id of sessionIds) {
    const session = await redis.hgetall(`${KEYS.USER_SESSION}${id}`)
    if (session) sessions.push(session)
  }

  return sessions as UserSession[]
}

export async function removeUserSession(sessionId: string): Promise<boolean> {
  const session = await redis.hgetall(`${KEYS.USER_SESSION}${sessionId}`)
  if (!session) return false

  await redis.del(`${KEYS.USER_SESSION}${sessionId}`)
  await redis.srem(`${KEYS.USER_SESSION}${session.userId}:sessions`, sessionId)

  return true
}

// Helper function untuk generateId
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

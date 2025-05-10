import { redis, KEYS, generateId, getCurrentTimestamp } from "../redis"
import { getUserById } from "./user"

export type Call = {
  id: string
  callerId: string
  receiverId: string
  startTime: string
  endTime?: string
  status: "missed" | "answered" | "rejected" | "ongoing"
  callType: "audio" | "video"
}

export async function startCall(callerId: string, receiverId: string, callType: "audio" | "video"): Promise<Call> {
  const id = generateId()
  const now = getCurrentTimestamp()

  const call: Call = {
    id,
    callerId,
    receiverId,
    startTime: now,
    status: "ongoing",
    callType,
  }

  // Simpan panggilan di Redis
  await redis.hset(`${KEYS.CALL}${id}`, call)

  // Tambahkan ke daftar panggilan pengguna
  await redis.zadd(`${KEYS.CALLS_FOR_USER}${callerId}`, { score: Date.now(), member: id })
  await redis.zadd(`${KEYS.CALLS_FOR_USER}${receiverId}`, { score: Date.now(), member: id })

  return call
}

export async function getCallById(id: string): Promise<Call | null> {
  const call = await redis.hgetall(`${KEYS.CALL}${id}`)
  return (call as Call) || null
}

export async function updateCallStatus(id: string, status: Call["status"], endTime?: string): Promise<Call | null> {
  const call = await getCallById(id)
  if (!call) return null

  const updatedCall = {
    ...call,
    status,
    ...(endTime ? { endTime } : {}),
  }

  await redis.hset(`${KEYS.CALL}${id}`, updatedCall)

  return updatedCall
}

export async function answerCall(id: string): Promise<Call | null> {
  return updateCallStatus(id, "answered")
}

export async function rejectCall(id: string): Promise<Call | null> {
  return updateCallStatus(id, "rejected", getCurrentTimestamp())
}

export async function endCall(id: string): Promise<Call | null> {
  return updateCallStatus(id, "answered", getCurrentTimestamp())
}

export async function getCallHistory(userId: string, limit = 10): Promise<any[]> {
  const callIds = await redis.zrange(`${KEYS.CALLS_FOR_USER}${userId}`, 0, limit - 1, { rev: true })
  const calls = []

  for (const id of callIds) {
    const call = await getCallById(id as string)
    if (call) {
      const caller = await getUserById(call.callerId)
      const receiver = await getUserById(call.receiverId)

      if (caller && receiver) {
        calls.push({
          ...call,
          caller,
          receiver,
        })
      }
    }
  }

  return calls
}

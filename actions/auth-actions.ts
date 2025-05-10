"use server"

import { login, logout, signup, getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  return login(email, password)
}

export async function signupUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  if (!email || !password || !fullName) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  return signup(email, password, fullName)
}

export async function logoutUser() {
  await logout()
  redirect("/auth/login")
}

export async function getUser() {
  return getCurrentUser()
}

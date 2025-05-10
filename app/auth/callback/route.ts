import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user profile exists, if not create one
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if user exists in users table
      const { data: existingUser } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (!existingUser) {
        // Create user profile
        const emojis = ["😀", "😎", "🤩", "🥳", "😊", "🤗", "🦄", "🐱", "🐶", "🦊"]
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]

        await supabase.from("users").insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || user.email?.split("@")[0] || "User",
          username: user.email?.split("@")[0] || `user_${Date.now()}`,
          avatar_emoji: randomEmoji,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_online: new Date().toISOString(),
          share_location: false,
        })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}

import { redirect } from "next/navigation"
import { getUserFromToken } from "@/lib/auth"

export default async function HomePage() {
  const user = await getUserFromToken()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}

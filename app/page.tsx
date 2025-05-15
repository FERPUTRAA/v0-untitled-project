import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUserFromToken } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  // Periksa apakah pengguna sudah login
  const user = await getUserFromToken()

  // Jika pengguna sudah login, redirect ke dashboard
  if (user) {
    redirect("/dashboard")
  }

  // Jika pengguna belum login, tampilkan halaman landing
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Amefry</h1>
          <Link href="/auth/login">
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-rose-50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Connect with People Anonymously
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Have anonymous 8-minute calls and make new friends from around the world.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/auth/login">
                  <Button size="lg" className="bg-rose-600 hover:bg-rose-700">
                    Start Random Call
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">© 2025 Amefry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FirebaseAuthProvider } from "@/context/firebase-auth-context"
import { SocketProvider } from "@/context/socket-context"
import { AuthProvider } from "@/context/auth-context" // Tambahkan ini

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Amefry - Connect with Friends",
  description: "A platform for meaningful connections",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <FirebaseAuthProvider>
            <AuthProvider>
              {" "}
              {/* Tambahkan ini */}
              <SocketProvider>{children}</SocketProvider>
            </AuthProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FcGoogle } from "react-icons/fc"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, Shield } from "lucide-react"
import { loginUser, signupUser, getUser } from "@/actions/auth-actions"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [error, setError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [googleRedirectUri, setGoogleRedirectUri] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUser()
      if (user) {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  // Check for error in URL
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config")
        if (response.ok) {
          const config = await response.json()
          setGoogleRedirectUri(config.googleRedirectUri)

          // Log the redirect URI for debugging
          console.log("Google Redirect URI:", config.googleRedirectUri)
        }
      } catch (error) {
        console.error("Failed to fetch config:", error)
      }
    }

    fetchConfig()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Silakan masukkan email dan kata sandi")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      const result = await loginUser(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Jika berhasil, arahkan ke dashboard
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login")
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name || !signupEmail || !signupPassword) {
      setError("Silakan isi semua kolom")
      return
    }

    if (!agreedToTerms) {
      setError("Anda harus menyetujui persyaratan dan pedoman komunitas")
      return
    }

    if (signupPassword.length < 6) {
      setError("Kata sandi harus minimal 6 karakter")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", signupEmail)
      formData.append("password", signupPassword)
      formData.append("fullName", name)

      const result = await signupUser(formData)

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // Jika berhasil, arahkan ke dashboard
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mendaftar")
      setIsLoading(false)
    }
  }

  // Fungsi untuk login dengan Google
  const handleGoogleLogin = () => {
    try {
      setIsLoading(true)
      setError("")

      // Gunakan redirect URI dari API config atau fallback ke nilai default
      const redirectUri = googleRedirectUri || `${window.location.origin}/auth/google/callback`

      // Log the redirect URI being used
      console.log("Using Google Redirect URI:", redirectUri)

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      }&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=email%20profile&prompt=select_account&access_type=offline`

      // Log the full auth URL
      console.log("Google Auth URL:", googleAuthUrl)

      window.location.href = googleAuthUrl
    } catch (err) {
      console.error("Error initiating Google login:", err)
      setError("Terjadi kesalahan saat memulai login Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Amefry</CardTitle>
          <CardDescription className="text-center">Masuk untuk mulai terhubung dengan orang-orang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 text-blue-800 border-blue-200">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Amefry adalah platform untuk komunikasi yang saling menghormati. Perundungan, pelecehan, dan konten tidak
              pantas tidak ditoleransi.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Sedang masuk..." : "Masuk"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Kata Sandi</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Saya menyetujui Persyaratan Layanan dan Pedoman Komunitas
                  </label>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Membuat akun..." : "Buat Akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-900">Atau lanjutkan dengan</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? (
              "Memuat..."
            ) : (
              <>
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-4 w-4 mr-1 text-green-600" />
            <span className="text-xs text-green-600">Dilindungi dengan enkripsi end-to-end</span>
          </div>
          <p className="mt-2 text-xs text-center text-gray-500">
            Dengan masuk, Anda menyetujui Persyaratan Layanan dan Pedoman Komunitas kami yang melarang perundungan,
            pelecehan, dan konten tidak pantas.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

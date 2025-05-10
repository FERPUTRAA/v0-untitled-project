"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Key, Lock, Info, CheckCircle, XCircle } from "lucide-react"
import { saveTwoFactorStatus } from "@/lib/two-factor-auth"
import { TwoFactorSetup } from "@/components/two-factor-setup"

export default function SecuritySettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Periksa apakah pengguna sudah login
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    if (isLoggedIn !== "true") {
      router.push("/auth/login")
      return
    }

    // Dapatkan informasi pengguna
    const storedUserId = localStorage.getItem("userId") || ""
    const storedEmail = localStorage.getItem("userEmail") || ""
    setUserId(storedUserId)
    setEmail(storedEmail)

    // Dapatkan status keamanan
    const encryptionStatus = localStorage.getItem("encryption_setup_complete")
    const twoFactorStatus = localStorage.getItem(`2fa_enabled_${storedUserId}`)

    setIsEncryptionEnabled(encryptionStatus === "true")
    setIsTwoFactorEnabled(twoFactorStatus === "true")
    setIsLoading(false)
  }, [router])

  const handleToggleEncryption = () => {
    // Dalam aplikasi nyata, ini akan memerlukan konfirmasi dan mungkin kata sandi
    const newStatus = !isEncryptionEnabled
    setIsEncryptionEnabled(newStatus)
    localStorage.setItem("encryption_setup_complete", newStatus.toString())

    if (newStatus) {
      alert("Enkripsi end-to-end telah diaktifkan. Pesan baru Anda sekarang akan dienkripsi.")
    } else {
      alert("Peringatan: Menonaktifkan enkripsi end-to-end akan membuat pesan Anda kurang aman.")
    }
  }

  const handleToggleTwoFactor = () => {
    if (isTwoFactorEnabled) {
      // Nonaktifkan 2FA (dalam aplikasi nyata, ini akan memerlukan konfirmasi)
      setIsTwoFactorEnabled(false)
      saveTwoFactorStatus(userId, false)
      alert("Verifikasi dua faktor telah dinonaktifkan. Ini mengurangi keamanan akun Anda.")
    } else {
      // Tampilkan pengaturan 2FA
      setShowTwoFactorSetup(true)
    }
  }

  const handleTwoFactorComplete = (success: boolean) => {
    setShowTwoFactorSetup(false)
    if (success) {
      setIsTwoFactorEnabled(true)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-rose-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Memuat pengaturan keamanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Pengaturan Keamanan</h1>
      </div>

      {showTwoFactorSetup ? (
        <TwoFactorSetup userId={userId} email={email} onComplete={handleTwoFactorComplete} />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-green-600" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>Kelola pengaturan keamanan untuk melindungi akun dan data Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Keamanan yang kuat membantu melindungi akun Anda dari akses yang tidak sah dan melindungi privasi
                  pesan Anda.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enkripsi End-to-End</Label>
                    <p className="text-sm text-gray-500">
                      Enkripsi pesan dan panggilan Anda sehingga hanya Anda dan penerima yang dapat mengaksesnya
                    </p>
                  </div>
                  <Switch checked={isEncryptionEnabled} onCheckedChange={handleToggleEncryption} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Verifikasi Dua Faktor</Label>
                    <p className="text-sm text-gray-500">
                      Tambahkan lapisan keamanan ekstra dengan memerlukan kode verifikasi saat masuk
                    </p>
                  </div>
                  <Switch checked={isTwoFactorEnabled} onCheckedChange={handleToggleTwoFactor} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5 text-blue-600" />
                Privasi Pesan
              </CardTitle>
              <CardDescription>Kelola pengaturan privasi untuk pesan dan panggilan Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Pesan Sementara</Label>
                  <p className="text-sm text-gray-500">Hapus pesan secara otomatis setelah jangka waktu tertentu</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Konfirmasi Baca</Label>
                  <p className="text-sm text-gray-500">Tampilkan kapan pesan Anda telah dibaca oleh penerima</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Blokir Tangkapan Layar</Label>
                  <p className="text-sm text-gray-500">Cegah pengguna lain mengambil tangkapan layar pesan Anda</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5 text-yellow-600" />
                Manajemen Perangkat
              </CardTitle>
              <CardDescription>Kelola perangkat yang memiliki akses ke akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Perangkat yang Masuk</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">Perangkat Ini</p>
                        <p className="text-xs text-gray-500">Chrome • Jakarta, Indonesia</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Detail
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium">iPhone 13</p>
                        <p className="text-xs text-gray-500">Safari • Bandung, Indonesia • 3 hari yang lalu</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600">
                      Keluarkan
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Keluarkan dari Semua Perangkat
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

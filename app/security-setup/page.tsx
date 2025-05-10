"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Key, CheckCircle, ArrowRight } from "lucide-react"
import { TwoFactorSetup } from "@/components/two-factor-setup"
import { generateKeyPair } from "@/lib/encryption"

export default function SecuritySetupPage() {
  const router = useRouter()
  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"welcome" | "encryption" | "2fa" | "complete">("welcome")
  const [encryptionSetupComplete, setEncryptionSetupComplete] = useState(false)
  const [twoFactorSetupComplete, setTwoFactorSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
  }, [router])

  const handleSetupEncryption = async () => {
    setIsLoading(true)

    try {
      // Hasilkan pasangan kunci untuk enkripsi end-to-end
      await generateKeyPair()

      // Dalam aplikasi nyata, kunci publik akan dikirim ke server

      // Tandai pengaturan enkripsi sebagai selesai
      localStorage.setItem("encryption_setup_complete", "true")
      setEncryptionSetupComplete(true)

      // Lanjutkan ke langkah berikutnya
      setStep("2fa")
    } catch (error) {
      console.error("Gagal mengatur enkripsi:", error)
      alert("Terjadi kesalahan saat mengatur enkripsi. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorComplete = (success: boolean) => {
    setTwoFactorSetupComplete(success)
    if (success) {
      setStep("complete")
    }
  }

  const handleSkip2FA = () => {
    setStep("complete")
  }

  const handleComplete = () => {
    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Pengaturan Keamanan Amefry</CardTitle>
            <CardDescription className="text-center">
              Tingkatkan keamanan akun Anda dengan fitur keamanan lanjutan
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "welcome" && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <Shield className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Selamat Datang di Pengaturan Keamanan</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Amefry menyediakan fitur keamanan tingkat lanjut untuk melindungi privasi dan data Anda. Mari kita
                    siapkan ini bersama-sama.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start p-4 border rounded-lg">
                    <Lock className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Enkripsi End-to-End</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Pesan dan panggilan Anda akan dienkripsi sehingga hanya Anda dan penerima yang dapat membaca
                        atau mendengarnya.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 border rounded-lg">
                    <Key className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Verifikasi Dua Faktor</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Tambahkan lapisan keamanan ekstra dengan memerlukan kode verifikasi saat masuk ke akun Anda.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setStep("encryption")}>
                  Mulai Pengaturan
                </Button>
              </div>
            )}

            {step === "encryption" && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <Lock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Enkripsi End-to-End</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Enkripsi end-to-end memastikan bahwa hanya Anda dan orang yang Anda ajak bicara yang dapat membaca
                    pesan atau mendengar panggilan Anda.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Bagaimana Enkripsi End-to-End Bekerja?</h3>
                  <p className="text-sm text-blue-700">
                    Ketika Anda mengaktifkan enkripsi end-to-end, kami akan membuat pasangan kunci unik untuk perangkat
                    Anda. Kunci pribadi Anda tidak pernah meninggalkan perangkat Anda, sementara kunci publik digunakan
                    untuk mengenkripsi pesan yang dikirim kepada Anda.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSetupEncryption}
                  disabled={isLoading || encryptionSetupComplete}
                >
                  {isLoading
                    ? "Mengatur Enkripsi..."
                    : encryptionSetupComplete
                      ? "Enkripsi Diaktifkan ✓"
                      : "Aktifkan Enkripsi End-to-End"}
                </Button>

                {encryptionSetupComplete && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setStep("2fa")}>
                      Lanjutkan ke Verifikasi Dua Faktor
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === "2fa" && (
              <div className="space-y-6">
                <TwoFactorSetup userId={userId} email={email} onComplete={handleTwoFactorComplete} />

                <div className="text-center">
                  <Button variant="link" onClick={handleSkip2FA}>
                    Lewati untuk sekarang
                  </Button>
                </div>
              </div>
            )}

            {step === "complete" && (
              <div className="space-y-6 text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Pengaturan Keamanan Selesai!</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Selamat! Anda telah berhasil mengatur fitur keamanan untuk akun Amefry Anda.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                  <h3 className="font-medium mb-2">Ringkasan Keamanan</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span>Enkripsi End-to-End: {encryptionSetupComplete ? "Aktif" : "Tidak Aktif"}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span>Verifikasi Dua Faktor: {twoFactorSetupComplete ? "Aktif" : "Tidak Aktif"}</span>
                    </div>
                  </div>
                </div>

                <Button className="mt-4" onClick={handleComplete}>
                  Lanjutkan ke Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, CheckCircle, XCircle } from "lucide-react"
import { generateTOTPSecret, generateQRCodeURL, verifyTOTP, saveTwoFactorStatus } from "@/lib/two-factor-auth"

type TwoFactorSetupProps = {
  userId: string
  email: string
  onComplete: (success: boolean) => void
}

export function TwoFactorSetup({ userId, email, onComplete }: TwoFactorSetupProps) {
  const [secret, setSecret] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [step, setStep] = useState<"generate" | "verify" | "success" | "error">("generate")
  const [error, setError] = useState("")

  useEffect(() => {
    if (step === "generate") {
      // Hasilkan rahasia baru
      const newSecret = generateTOTPSecret()
      setSecret(newSecret)

      // Hasilkan URL QR code
      const qrUrl = generateQRCodeURL(newSecret, email)
      setQrCodeUrl(qrUrl)
    }
  }, [step, email])

  const handleVerify = () => {
    if (!verificationCode) {
      setError("Silakan masukkan kode verifikasi")
      return
    }

    // Verifikasi kode yang dimasukkan
    const isValid = verifyTOTP(secret, verificationCode)

    if (isValid) {
      // Simpan status 2FA
      saveTwoFactorStatus(userId, true, secret)
      setStep("success")
    } else {
      setError("Kode verifikasi tidak valid. Silakan coba lagi.")
      setStep("error")
    }
  }

  const handleComplete = () => {
    onComplete(step === "success")
  }

  const resetSetup = () => {
    setVerificationCode("")
    setError("")
    setStep("generate")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pengaturan Verifikasi Dua Faktor</CardTitle>
        <CardDescription>
          Tingkatkan keamanan akun Anda dengan menambahkan lapisan perlindungan tambahan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {step === "generate" && (
          <>
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Pindai kode QR di bawah ini dengan aplikasi autentikator seperti Google Authenticator, Authy, atau
                Microsoft Authenticator.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center py-4">
              {/* Dalam aplikasi nyata, gunakan komponen QR code generator */}
              <div className="border p-4 bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeUrl)}&size=200x200`}
                  alt="QR Code untuk 2FA"
                  width={200}
                  height={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Kode Rahasia (jika tidak dapat memindai QR)</Label>
              <div className="flex">
                <Input id="secret" value={secret} readOnly className="font-mono" />
                <Button variant="outline" className="ml-2" onClick={() => navigator.clipboard.writeText(secret)}>
                  Salin
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep("verify")}>
              Lanjutkan
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Buka aplikasi autentikator Anda dan masukkan kode 6 digit yang ditampilkan untuk Amefry.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Kode Verifikasi</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Masukkan kode 6 digit"
                maxLength={6}
                className="font-mono text-center text-lg"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="w-1/2" onClick={resetSetup}>
                Kembali
              </Button>
              <Button className="w-1/2" onClick={handleVerify}>
                Verifikasi
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div className="flex flex-col items-center py-4 space-y-2">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-medium">Verifikasi Dua Faktor Diaktifkan!</h3>
              <p className="text-center text-gray-500">
                Akun Anda sekarang dilindungi dengan lapisan keamanan tambahan. Anda akan diminta memasukkan kode dari
                aplikasi autentikator Anda setiap kali masuk.
              </p>
            </div>

            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Penting: Simpan kode cadangan Anda</p>
                <p className="mt-1">
                  Jika Anda kehilangan akses ke aplikasi autentikator, Anda akan memerlukan kode cadangan untuk masuk ke
                  akun Anda.
                </p>
                <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-center">ABCD-EFGH-IJKL-MNOP</div>
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={handleComplete}>
              Selesai
            </Button>
          </>
        )}

        {step === "error" && (
          <>
            <div className="flex flex-col items-center py-4 space-y-2">
              <XCircle className="h-16 w-16 text-red-500" />
              <h3 className="text-xl font-medium">Verifikasi Gagal</h3>
              <p className="text-center text-gray-500">
                Kode yang Anda masukkan tidak valid. Pastikan waktu pada perangkat Anda sinkron dan coba lagi.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="w-1/2" onClick={resetSetup}>
                Coba Lagi
              </Button>
              <Button className="w-1/2" onClick={handleComplete}>
                Batalkan
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

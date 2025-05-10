"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import { verifyTOTP, getTwoFactorSecret } from "@/lib/two-factor-auth"

type TwoFactorVerifyProps = {
  userId: string
  onVerify: (success: boolean) => void
}

export function TwoFactorVerify({ userId, onVerify }: TwoFactorVerifyProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = () => {
    if (!verificationCode) {
      setError("Silakan masukkan kode verifikasi")
      return
    }

    setIsLoading(true)
    setError("")

    // Dapatkan rahasia 2FA pengguna
    const secret = getTwoFactorSecret(userId)

    // Verifikasi kode yang dimasukkan
    const isValid = verifyTOTP(secret, verificationCode)

    setTimeout(() => {
      setIsLoading(false)

      if (isValid) {
        onVerify(true)
      } else {
        setError("Kode verifikasi tidak valid. Silakan coba lagi.")
        setVerificationCode("")
      }
    }, 1000)
  }

  const handleUseRecoveryCode = () => {
    // Dalam aplikasi nyata, implementasikan logika untuk kode pemulihan
    alert("Fitur kode pemulihan akan diimplementasikan di masa mendatang.")
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verifikasi Dua Faktor</CardTitle>
        <CardDescription>Masukkan kode dari aplikasi autentikator Anda untuk melanjutkan</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <Button className="w-full" onClick={handleVerify} disabled={isLoading}>
          {isLoading ? "Memverifikasi..." : "Verifikasi"}
        </Button>
        <Button variant="link" onClick={handleUseRecoveryCode}>
          Gunakan kode pemulihan
        </Button>
      </CardFooter>
    </Card>
  )
}

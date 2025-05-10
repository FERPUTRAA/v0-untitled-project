"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verifikasi Email Anda</CardTitle>
          <CardDescription className="text-center">
            Kami telah mengirimkan email verifikasi ke alamat email Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Silakan periksa kotak masuk email Anda dan klik tautan verifikasi untuk mengaktifkan akun Anda.
            </p>
            <p className="text-sm text-gray-500">
              Jika Anda tidak menerima email dalam beberapa menit, periksa folder spam atau sampah.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Halaman Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

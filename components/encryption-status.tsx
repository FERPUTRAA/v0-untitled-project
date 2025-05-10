"use client"

import { useState, useEffect } from "react"
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type EncryptionStatusProps = {
  chatId: string
}

export function EncryptionStatus({ chatId }: EncryptionStatusProps) {
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    // Dalam aplikasi nyata, periksa status enkripsi dari penyimpanan atau state aplikasi
    // Untuk demonstrasi, kita gunakan localStorage
    const encryptionStatus = localStorage.getItem(`chat_encrypted_${chatId}`)
    const verificationStatus = localStorage.getItem(`chat_verified_${chatId}`)

    setIsEncrypted(encryptionStatus === "true")
    setIsVerified(verificationStatus === "true")

    // Jika tidak ada status, atur enkripsi secara default untuk chat baru
    if (encryptionStatus === null) {
      localStorage.setItem(`chat_encrypted_${chatId}`, "true")
      setIsEncrypted(true)
    }
  }, [chatId])

  const handleVerifyIdentity = () => {
    // Dalam aplikasi nyata, ini akan membuka dialog untuk memverifikasi identitas
    // Untuk demonstrasi, kita hanya mengubah status
    localStorage.setItem(`chat_verified_${chatId}`, "true")
    setIsVerified(true)

    alert(
      "Identitas terverifikasi! Dalam aplikasi nyata, ini akan melibatkan pemeriksaan kode keamanan atau pemindaian QR.",
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-1 cursor-help">
            {isEncrypted ? (
              isVerified ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-yellow-500" />
              )
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500">{isEncrypted ? "Terenkripsi" : "Tidak Terenkripsi"}</span>
            {!isVerified && isEncrypted && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleVerifyIdentity}>
                Verifikasi
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">{isEncrypted ? "Pesan terenkripsi end-to-end" : "Pesan tidak terenkripsi"}</p>
            <p className="text-sm">
              {isEncrypted
                ? "Pesan dan panggilan Anda diamankan dengan enkripsi end-to-end. Hanya Anda dan penerima yang dapat membaca atau mendengar mereka."
                : "Pesan Anda tidak diamankan dengan enkripsi end-to-end. Pertimbangkan untuk mengaktifkan enkripsi untuk keamanan yang lebih baik."}
            </p>
            {isEncrypted && !isVerified && (
              <div className="pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleVerifyIdentity}>
                  Verifikasi Identitas
                </Button>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

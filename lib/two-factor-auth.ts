/**
 * Implementasi Verifikasi Dua Faktor untuk Amefry
 * Menggunakan algoritma TOTP (Time-based One-Time Password)
 */

// Fungsi untuk menghasilkan kunci rahasia TOTP
export function generateTOTPSecret() {
  // Dalam implementasi nyata, gunakan library kriptografi yang tepat
  // Ini adalah implementasi sederhana untuk demonstrasi
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let secret = ""

  // Buat string acak 16 karakter
  for (let i = 0; i < 16; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    secret += characters[randomIndex]
  }

  return secret
}

// Fungsi untuk menghasilkan URL QR code untuk aplikasi autentikator
export function generateQRCodeURL(secret: string, email: string) {
  const issuer = encodeURIComponent("Amefry")
  const account = encodeURIComponent(email)
  const secretParam = encodeURIComponent(secret)

  return `otpauth://totp/${issuer}:${account}?secret=${secretParam}&issuer=${issuer}`
}

// Fungsi untuk memverifikasi kode TOTP
export function verifyTOTP(secret: string, userToken: string) {
  // Dalam aplikasi nyata, gunakan library seperti 'otplib'
  // Ini adalah implementasi sederhana untuk demonstrasi

  // Dapatkan waktu saat ini dalam detik dan bagi dengan 30 (periode TOTP standar)
  const now = Math.floor(Date.now() / 1000 / 30)

  // Hitung token yang valid untuk periode waktu saat ini dan sebelumnya
  // (untuk mengakomodasi sedikit ketidaksinkronan jam)
  const expectedTokens = [calculateTOTP(secret, now), calculateTOTP(secret, now - 1), calculateTOTP(secret, now + 1)]

  // Periksa apakah token pengguna cocok dengan salah satu token yang diharapkan
  return expectedTokens.includes(userToken)
}

// Fungsi untuk menghasilkan kode TOTP saat ini
export function generateTOTP(secret: string): string {
  const now = Math.floor(Date.now() / 1000 / 30)
  return calculateTOTP(secret, now)
}

// Fungsi pembantu untuk menghitung token TOTP
// Ini adalah implementasi sederhana, dalam aplikasi nyata gunakan library yang tepat
function calculateTOTP(secret: string, counter: number) {
  // Implementasi sederhana untuk demonstrasi
  // Dalam aplikasi nyata, gunakan HMAC-SHA1 dan perhitungan yang tepat

  // Konversi counter ke string dan gabungkan dengan secret
  const data = secret + counter.toString()

  // Buat hash sederhana (TIDAK AMAN, hanya untuk demonstrasi)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i)
    hash |= 0 // Konversi ke integer 32-bit
  }

  // Ambil 6 digit terakhir
  const token = Math.abs(hash) % 1000000

  // Pastikan token selalu 6 digit dengan padding nol di depan jika perlu
  return token.toString().padStart(6, "0")
}

// Fungsi untuk menyimpan status 2FA pengguna
export function saveTwoFactorStatus(userId: string, isEnabled: boolean, secret?: string) {
  // Dalam aplikasi nyata, ini akan disimpan di database server
  // Untuk demonstrasi, kita gunakan localStorage
  localStorage.setItem(`2fa_enabled_${userId}`, isEnabled.toString())

  if (secret) {
    // Dalam aplikasi nyata, JANGAN simpan rahasia di sisi klien
    // Ini hanya untuk demonstrasi
    localStorage.setItem(`2fa_secret_${userId}`, secret)
  }
}

// Fungsi untuk memeriksa apakah 2FA diaktifkan untuk pengguna
export function isTwoFactorEnabled(userId: string) {
  const status = localStorage.getItem(`2fa_enabled_${userId}`)
  return status === "true"
}

// Fungsi untuk mendapatkan rahasia 2FA pengguna
export function getTwoFactorSecret(userId: string) {
  // Dalam aplikasi nyata, ini akan diambil dari database server
  return localStorage.getItem(`2fa_secret_${userId}`) || ""
}

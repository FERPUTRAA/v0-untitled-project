/**
 * Enkripsi End-to-End untuk Amefry
 * Menggunakan Web Crypto API untuk implementasi enkripsi yang aman
 */

// Fungsi untuk menghasilkan pasangan kunci untuk pengguna
export async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey", "deriveBits"],
    )

    // Ekspor kunci publik untuk dibagikan
    const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey)

    // Simpan kunci privat di localStorage (dalam aplikasi nyata, gunakan penyimpanan yang lebih aman)
    const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey)
    localStorage.setItem("privateKey", JSON.stringify(privateKeyJwk))

    return {
      publicKey: publicKeyJwk,
      privateKey: privateKeyJwk,
    }
  } catch (error) {
    console.error("Gagal menghasilkan pasangan kunci:", error)
    throw new Error("Gagal menghasilkan kunci enkripsi")
  }
}

// Fungsi untuk membuat kunci sesi bersama dari kunci publik penerima dan kunci privat pengirim
export async function deriveSharedSecret(publicKeyJwk: JsonWebKey, privateKeyJwk: JsonWebKey) {
  try {
    // Impor kunci publik penerima
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      [],
    )

    // Impor kunci privat pengirim
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey", "deriveBits"],
    )

    // Turunkan kunci bersama
    const sharedSecret = await window.crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )

    return sharedSecret
  } catch (error) {
    console.error("Gagal menurunkan kunci bersama:", error)
    throw new Error("Gagal membuat kunci enkripsi bersama")
  }
}

// Fungsi untuk mengenkripsi pesan
export async function encryptMessage(message: string, sharedKey: CryptoKey) {
  try {
    // Buat vektor inisialisasi (IV) acak
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    // Enkripsi pesan
    const encodedMessage = new TextEncoder().encode(message)
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sharedKey,
      encodedMessage,
    )

    // Gabungkan IV dan data terenkripsi untuk transmisi
    const encryptedArray = new Uint8Array(iv.length + encryptedData.byteLength)
    encryptedArray.set(iv)
    encryptedArray.set(new Uint8Array(encryptedData), iv.length)

    // Konversi ke string base64 untuk transmisi yang mudah
    return btoa(String.fromCharCode(...encryptedArray))
  } catch (error) {
    console.error("Gagal mengenkripsi pesan:", error)
    throw new Error("Gagal mengenkripsi pesan")
  }
}

// Fungsi untuk mendekripsi pesan
export async function decryptMessage(encryptedMessage: string, sharedKey: CryptoKey) {
  try {
    // Konversi dari base64 kembali ke array byte
    const encryptedArray = new Uint8Array(
      atob(encryptedMessage)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )

    // Ekstrak IV dan data terenkripsi
    const iv = encryptedArray.slice(0, 12)
    const encryptedData = encryptedArray.slice(12)

    // Dekripsi pesan
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sharedKey,
      encryptedData,
    )

    // Konversi kembali ke string
    return new TextDecoder().decode(decryptedData)
  } catch (error) {
    console.error("Gagal mendekripsi pesan:", error)
    throw new Error("Gagal mendekripsi pesan")
  }
}

// Fungsi untuk menghasilkan kunci sesi baru untuk setiap percakapan
export async function generateSessionKey() {
  try {
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )

    return key
  } catch (error) {
    console.error("Gagal menghasilkan kunci sesi:", error)
    throw new Error("Gagal membuat kunci sesi")
  }
}

// Fungsi untuk mengekspor kunci sesi ke format yang dapat ditransmisikan
export async function exportSessionKey(key: CryptoKey) {
  try {
    const exportedKey = await window.crypto.subtle.exportKey("jwk", key)
    return JSON.stringify(exportedKey)
  } catch (error) {
    console.error("Gagal mengekspor kunci sesi:", error)
    throw new Error("Gagal mengekspor kunci sesi")
  }
}

// Fungsi untuk mengimpor kunci sesi dari format yang ditransmisikan
export async function importSessionKey(keyData: string) {
  try {
    const keyJwk = JSON.parse(keyData)
    const key = await window.crypto.subtle.importKey(
      "jwk",
      keyJwk,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )
    return key
  } catch (error) {
    console.error("Gagal mengimpor kunci sesi:", error)
    throw new Error("Gagal mengimpor kunci sesi")
  }
}

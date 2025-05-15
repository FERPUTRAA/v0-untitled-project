import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXTf6GbcM7BwAiHaGWcwA8kkijmEGS9go",
  authDomain: "kondisi-33c71.firebaseapp.com",
  projectId: "kondisi-33c71",
  storageBucket: "kondisi-33c71.firebasestorage.app",
  messagingSenderId: "644328273499",
  appId: "1:644328273499:web:ba8846e41498761e29717e",
  measurementId: "G-K6FG85WMZJ",
}

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig)

// Inisialisasi Auth
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Inisialisasi Analytics (hanya di browser)
export const initAnalytics = () => {
  if (typeof window !== "undefined") {
    return getAnalytics(app)
  }
  return null
}

export default app

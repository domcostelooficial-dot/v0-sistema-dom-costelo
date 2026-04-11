import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBkHUq8XXVoYL2c5sdEm3uroIiJg_ABMfo",
  authDomain: "domcostelo-pro.firebaseapp.com",
  projectId: "domcostelo-pro",
  storageBucket: "domcostelo-pro.firebasestorage.app",
  messagingSenderId: "667754972644",
  appId: "1:667754972644:web:d90cb3e74ecf6e9a3673f1",
  measurementId: "G-VKP3KSMWPN",
}

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

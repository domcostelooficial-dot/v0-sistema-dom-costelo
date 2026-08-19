"use client"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth"
import { auth } from "./firebase"

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

export async function logout() {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function changePassword(user: User, currentPassword: string, newPassword: string) {
  try {
    if (!user.email) return { error: "Email da sessão não encontrado" }
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
    return { error: null }
  } catch (error: any) {
    const code = error?.code
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return { error: "Senha atual incorreta." }
    if (code === "auth/requires-recent-login") return { error: "Não foi possível reautenticar a sessão recente." }
    return { error: error.message }
  }
}

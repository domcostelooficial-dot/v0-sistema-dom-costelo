"use client"

import { FirebaseLoginForm } from "@/components/firebase-login-form"

interface LoginFormProps {
  onLogin: (user: string, role: string, permissoes: string[]) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  return <FirebaseLoginForm onLogin={onLogin} />
}

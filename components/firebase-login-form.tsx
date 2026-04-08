"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Lock, User } from "lucide-react"
import { signInWithEmail } from "@/lib/firebase-auth"
import { getUsuarioProfile } from "@/lib/firebase-db"
import type { UsuarioSistema } from "@/lib/types"

interface FirebaseLoginFormProps {
  onLogin: (user: string, role: string, permissoes: string[]) => void
}

export function FirebaseLoginForm({ onLogin }: FirebaseLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Authenticate with Firebase
      const { user, error: authError } = await signInWithEmail(email, password)
      
      if (authError || !user) {
        setError("Email ou senha inválidos")
        setLoading(false)
        return
      }

      // Get user profile from Firestore
      const { data: profile, error: profileError } = await getUsuarioProfile(user.uid)
      
      if (profileError || !profile) {
        setError("Erro ao carregar perfil do usuário")
        setLoading(false)
        return
      }

      // Login successful
      onLogin(user.email || user.uid, profile.role, profile.permissoes)
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24">
              <Image
                src="/logo.png"
                alt="Dom Costelo Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Sistema Dom Costelo
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10 bg-input border-border"
                    required
                    disabled={loading}
                  />
                </div>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-input border-border"
                    required
                    disabled={loading}
                  />
                </div>
              </Field>
            </FieldGroup>

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Lock, User } from "lucide-react"
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase-auth"

interface FirebaseLoginFormProps {
  onLogin: (user: string, role: string, permissoes: string[]) => void
}

export function FirebaseLoginForm({ onLogin }: FirebaseLoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validação para cadastro
    if (isSignUp) {
      if (password.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres")
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem")
        setLoading(false)
        return
      }
    }

    try {
      let user
      let authError

      if (isSignUp) {
        // Criar nova conta
        const result = await signUpWithEmail(email, password)
        user = result.user
        authError = result.error
      } else {
        // Fazer login
        const result = await signInWithEmail(email, password)
        user = result.user
        authError = result.error
      }
      
      if (authError || !user) {
        setError(isSignUp ? "Erro ao criar conta. Verifique os dados." : "Email ou senha inválidos")
        setLoading(false)
        return
      }

      // Login/Cadastro bem-sucedido - usar permissões padrão de admin
      const role = "admin"
      const permissoes = ["estoque", "entrada", "producao", "financeiro", "dashboard", "lista-compras", "admin"]
      const displayName = user.email?.split("@")[0] || user.uid
      onLogin(displayName, role, permissoes)
    } catch (err) {
      setError(isSignUp ? "Erro ao criar conta. Tente novamente." : "Erro ao fazer login. Tente novamente.")
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
                src="/logo.jpg"
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
            {isSignUp ? "Crie sua conta para acessar o sistema" : "Faça login para acessar o sistema"}
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

            {isSignUp && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirmar Senha</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-input border-border"
                      required
                      disabled={loading}
                    />
                  </div>
                </Field>
              </FieldGroup>
            )}

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
              {loading 
                ? (isSignUp ? "Criando conta..." : "Entrando...") 
                : (isSignUp ? "Criar Conta" : "Entrar")
              }
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError("")
                  setConfirmPassword("")
                }}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                {isSignUp 
                  ? "Já tem uma conta? Faça login" 
                  : "Não tem conta? Crie uma agora"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

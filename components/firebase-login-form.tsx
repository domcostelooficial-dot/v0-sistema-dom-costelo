"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Lock, User, Mail } from "lucide-react"
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase-auth"
import type { User as FirebaseUser } from "firebase/auth"
import { createUsuarioProfile, getUsuarioProfile } from "@/lib/firebase-db"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import type { UsuarioSistema } from "@/lib/types"

interface FirebaseLoginFormProps {
  onLogin: (user: string, role: string, permissoes: string[]) => void
}

export function FirebaseLoginForm({ onLogin }: FirebaseLoginFormProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    // Validacao para cadastro
    if (isSignUp) {
      if (!nome.trim()) {
        setError("Digite seu nome")
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError("A senha deve ter no minimo 6 caracteres")
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError("As senhas nao coincidem")
        setLoading(false)
        return
      }
    }

    try {
      let user: FirebaseUser | null = null
      let authError: string | null = null

      if (isSignUp) {
        // Criar nova conta no Firebase
        const result = await signUpWithEmail(email, password)
        user = result.user
        authError = result.error

        if (authError || !user) {
          const mensagem = authError?.toLowerCase() ?? ""
          if (mensagem.includes("email-already-in-use")) {
            setError("Este email já está cadastrado. Faça login ou use outro email.")
          } else if (mensagem.includes("invalid-email")) {
            setError("Digite um email válido.")
          } else if (mensagem.includes("weak-password")) {
            setError("A senha deve ter pelo menos 6 caracteres.")
          } else if (mensagem.includes("operation-not-allowed")) {
            setError("O cadastro por email está desativado no Firebase. Ative o provedor Email/Senha no Firebase Console.")
          } else {
            setError("Não foi possível criar a conta. Verifique o email e tente novamente.")
            console.error("[v0] Erro detalhado ao criar conta Firebase:", authError)
          }
          setLoading(false)
          return
        }

        const displayName = user!.email?.split("@")[0] || user!.uid
        const novoUsuario: UsuarioSistema = {
          uid: user!.uid,
          login: displayName,
          nome: nome.trim(),
          email: user!.email || "",
          role: "operador",
          permissoes: [],
          status: "pendente",
          ativo: false,
          dataCriacao: new Date().toLocaleString("pt-BR"),
        }
        const profileResult = await createUsuarioProfile(user!.uid, novoUsuario)
        if (profileResult.error) {
          await signOut(auth)
          setError("A conta foi criada, mas não foi possível salvar o perfil na nuvem. Tente novamente.")
          setLoading(false)
          return
        }

        // Mostrar mensagem de sucesso e aguardar aprovacao
        setSuccess("Conta criada com sucesso! Aguarde a aprovacao do administrador para acessar o sistema.")
        setLoading(false)
        setNome("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        return

      } else {
        // Fazer login
        const result = await signInWithEmail(email.trim(), password)
        user = result.user
        authError = result.error
      }
      
      if (authError || !user) {
        setError("Email ou senha invalidos")
        setLoading(false)
        return
      }

      const displayName = user!.email?.split("@")[0] || user!.uid
      const isPrincipalOwner = user!.email?.toLowerCase() === "admin@domcostelo.com"

      // O administrador principal não deve esperar uma leitura do Firestore
      // para entrar. Isso evita lentidão quando o Firestore está indisponível.
      if (isPrincipalOwner) {
        setLoading(false)
        onLogin(displayName, "owner", ["estoque", "entrada", "financeiro", "dashboard", "lista-compras", "cmv", "admin"])
        return
      }

      const { data: usuarioSistema, error: profileError } = await getUsuarioProfile(user!.uid)

      if (profileError || !usuarioSistema) {
        await signOut(auth)
        setError("Seu usuário autenticado ainda não possui um perfil autorizado no Firestore.")
        setLoading(false)
        return
      }
      if (usuarioSistema.ativo === false || usuarioSistema.status === "pendente" || usuarioSistema.status === "rejeitado") {
        await signOut(auth)
        setError(usuarioSistema.ativo === false ? "Seu acesso está desativado." : "Sua conta aguarda aprovação do administrador.")
        setLoading(false)
        return
      }
      setLoading(false)
      onLogin(displayName, usuarioSistema.role, usuarioSistema.permissoes)
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
            <div className="relative w-64 h-36">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1_20260424_133557_0000-df20aL2H0s0hc4p0RXFd0STSUMJ4s8.png"
                alt="Dom Costelo — A Casa da Costelinha"
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
            {isSignUp && (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nome">Nome Completo</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="pl-10 bg-input border-border"
                      required
                      disabled={loading}
                    />
                  </div>
                </Field>
              </FieldGroup>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

            {success && (
              <div className="text-sm text-success text-center p-3 bg-success/10 rounded-md border border-success/30">
                {success}
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
                  setSuccess("")
                  setNome("")
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

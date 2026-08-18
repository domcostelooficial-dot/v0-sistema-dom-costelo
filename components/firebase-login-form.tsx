"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Lock, User, Mail } from "lucide-react"
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase-auth"
import type { User as FirebaseUser } from "firebase/auth"
import { getUsuarios, saveUsuarios } from "@/lib/store"
import { getAllUsuarios, createUsuarioProfile } from "@/lib/firebase-db"
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

  // Inicializar usuarios do Firebase e localStorage quando o componente monta
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        // Carregar do localStorage primeiro
        getUsuarios()
        
        // Tentar carregar do Firebase
        const { data: firebaseUsuarios, error } = await getAllUsuarios()
        if (!error && firebaseUsuarios && firebaseUsuarios.length > 0) {
          // Sincronizar com localStorage
          saveUsuarios(firebaseUsuarios)
        }
      } catch (err) {
        console.error("[v0] Erro ao inicializar usuarios:", err)
      }
    }
    loadUsuarios()
  }, [])

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
          setError("Erro ao criar conta. Verifique os dados.")
          setLoading(false)
          return
        }

        // Criar usuario pendente no sistema local e Firebase
        const usuarios = getUsuarios()
        const displayName = user!.email?.split("@")[0] || user!.uid
        
        // Verificar se ja existe
        if (!usuarios.some(u => u.email === user!.email)) {
          const novoUsuario: UsuarioSistema = {
            login: displayName,
            nome: nome.trim(),
            senha: "", // Senha gerenciada pelo Firebase
            email: user!.email || "",
            role: "operador",
            permissoes: [],
            status: "pendente",
            dataCriacao: new Date().toLocaleString("pt-BR"),
          }
          usuarios.push(novoUsuario)
          saveUsuarios(usuarios)
          
          // Salvar no Firebase também
          const { login, ...userData } = novoUsuario
          await createUsuarioProfile(login, userData)
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
        const result = await signInWithEmail(email, password)
        user = result.user
        authError = result.error
      }
      
      if (authError || !user) {
        setError("Email ou senha invalidos")
        setLoading(false)
        return
      }

      // Verificar se é o administrador master (sempre tem acesso)
      const emailAdmin = "admin@domcostelo.com"
      
      if (user!.email === emailAdmin) {
        console.log("[v0] Admin master detectado - acesso garantido")
        const usuarios = getUsuarios()
        
        // Garantir que admin existe no sistema local e Firebase
        let adminLocal = usuarios.find(u => u.email === emailAdmin)
        if (!adminLocal) {
          adminLocal = {
            login: "admin",
            senha: "",
            email: emailAdmin,
            role: "admin",
            permissoes: ["estoque", "entrada", "financeiro", "dashboard", "lista-compras", "admin"],
            status: "aprovado",
            dataCriacao: new Date().toLocaleString("pt-BR"),
          }
          usuarios.push(adminLocal)
          saveUsuarios(usuarios)
          
          // Salvar no Firebase também
          const { login, ...userData } = adminLocal
          await createUsuarioProfile(login, userData)
        }
        
        setLoading(false)
        onLogin("admin", "admin", ["estoque", "entrada", "financeiro", "dashboard", "lista-compras", "admin"])
        return
      }

      // Verificar se usuario esta aprovado
      const usuarios = getUsuarios()
      const displayName = user!.email?.split("@")[0] || user!.uid
      
      // Buscar por email ou por login (para usuarios antigos)
      let usuarioSistema = usuarios.find(u => u.email === user!.email)
      if (!usuarioSistema) {
        usuarioSistema = usuarios.find(u => u.login.toLowerCase() === displayName.toLowerCase())
      }
      
      // Verificar se existe algum admin aprovado no sistema
      const existeAdminAprovado = usuarios.some(u => u.role === "admin" && u.status === "aprovado")
      
      if (!usuarioSistema) {
        // Se nao existe nenhum admin aprovado, o primeiro usuario vira admin automaticamente
        if (!existeAdminAprovado) {
          console.log("[v0] Primeiro usuario - tornando admin")
          const novoAdmin: UsuarioSistema = {
            login: displayName,
            senha: "",
            email: user!.email || "",
            role: "admin",
            permissoes: ["estoque", "entrada", "financeiro", "dashboard", "lista-compras", "admin"],
            status: "aprovado",
            dataCriacao: new Date().toLocaleString("pt-BR"),
          }
          usuarios.push(novoAdmin)
          saveUsuarios(usuarios)
          
          // Salvar no Firebase também
          const { login, ...userData } = novoAdmin
          await createUsuarioProfile(login, userData)
          
          setLoading(false)
          onLogin(displayName, novoAdmin.role, novoAdmin.permissoes)
          return
        }
        
        // Usuario nao existe no sistema - criar como pendente
        console.log("[v0] Novo usuario - criando como pendente")
        const novoUsuario: UsuarioSistema = {
          login: displayName,
          senha: "",
          email: user!.email || "",
          role: "operador",
          permissoes: [],
          status: "pendente",
          dataCriacao: new Date().toLocaleString("pt-BR"),
        }
        usuarios.push(novoUsuario)
        saveUsuarios(usuarios)
        
        // Salvar no Firebase também
        const { login, ...userData } = novoUsuario
        await createUsuarioProfile(login, userData)
        
        setError("Sua conta esta pendente de aprovacao. Entre em contato com o administrador.")
        setLoading(false)
        return
      }

      // Verificar status do usuario
      console.log("[v0] Usuario encontrado:", usuarioSistema.login, "Status:", usuarioSistema.status)
      
      if (usuarioSistema.status === "pendente") {
        setError("Sua conta esta aguardando aprovacao do administrador.")
        setLoading(false)
        return
      }

      if (usuarioSistema.status === "rejeitado") {
        setError("Seu acesso foi negado pelo administrador.")
        setLoading(false)
        return
      }

      // Usuario aprovado ou sem status (antigos) - fazer login
      console.log("[v0] Login bem-sucedido para:", usuarioSistema.login)
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

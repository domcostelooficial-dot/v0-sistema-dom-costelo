"use client"

import { Item, HistoricoEntry, Receita, UsuarioSistema, defaultItens, defaultReceitas } from "./types"

const ESTOQUE_KEY = "dom-costelo-estoque"
const HISTORICO_KEY = "dom-costelo-historico"
const USER_KEY = "dom-costelo-user"
const RECEITAS_KEY = "dom-costelo-receitas"
const USUARIOS_KEY = "dom-costelo-usuarios"

const defaultUsuarios: UsuarioSistema[] = [
  {
    login: "thiago",
    senha: "123",
    email: "thiago@domcostelo.com",
    role: "admin",
    permissoes: ["estoque", "entrada", "financeiro", "dashboard", "lista-compras", "admin"],
    status: "aprovado",
  },
  {
    login: "debora",
    senha: "456",
    email: "debora@domcostelo.com",
    role: "operador",
    permissoes: ["estoque", "entrada", "dashboard", "lista-compras"],
    status: "aprovado",
  },
  {
    login: "marcos",
    senha: "789",
    email: "marcos@domcostelo.com",
    role: "operador",
    permissoes: ["estoque", "entrada", "dashboard", "lista-compras"],
    status: "aprovado",
  },
]

export function getEstoque(): Item[] {
  if (typeof window === "undefined") return defaultItens
  const stored = localStorage.getItem(ESTOQUE_KEY)
  return stored ? JSON.parse(stored) : defaultItens
}

export function saveEstoque(itens: Item[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ESTOQUE_KEY, JSON.stringify(itens))
}

export function getHistorico(): HistoricoEntry[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(HISTORICO_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveHistorico(historico: HistoricoEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico))
}

export function getUser(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(USER_KEY)
}

export function saveUser(user: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_KEY, user)
}

export function clearUser() {
  if (typeof window === "undefined") return
  localStorage.removeItem(USER_KEY)
}

export function getReceitas(): Receita[] {
  if (typeof window === "undefined") return defaultReceitas
  const stored = localStorage.getItem(RECEITAS_KEY)
  return stored ? JSON.parse(stored) : defaultReceitas
}

export function saveReceitas(receitas: Receita[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(RECEITAS_KEY, JSON.stringify(receitas))
}

export function getUsuarios(): UsuarioSistema[] {
  if (typeof window === "undefined") return defaultUsuarios
  const stored = localStorage.getItem(USUARIOS_KEY)
  if (!stored) return defaultUsuarios
  
  // Migrar usuarios antigos que nao tem status
  const usuarios = JSON.parse(stored) as UsuarioSistema[]
  let needsUpdate = false
  
  const migratedUsuarios = usuarios.map(u => {
    if (!u.status) {
      needsUpdate = true
      return { ...u, status: "aprovado" as const }
    }
    return u
  })
  
  // Salvar se houve migracao
  if (needsUpdate) {
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(migratedUsuarios))
  }
  
  return migratedUsuarios
}

export function saveUsuarios(usuarios: UsuarioSistema[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuarios))
}

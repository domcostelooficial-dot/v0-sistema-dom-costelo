"use client"

import { Item, HistoricoEntry, defaultItens } from "./types"

const ESTOQUE_KEY = "dom-costelo-estoque"
const HISTORICO_KEY = "dom-costelo-historico"
const USER_KEY = "dom-costelo-user"

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

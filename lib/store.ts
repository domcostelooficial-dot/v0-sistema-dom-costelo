"use client"

import { Item, HistoricoEntry, Receita, defaultItens, defaultReceitas, catalogoEmbalagens } from "./types"

const ESTOQUE_KEY = "dom-costelo-estoque"
const HISTORICO_KEY = "dom-costelo-historico"
const RECEITAS_KEY = "dom-costelo-receitas"

function enriquecerItens(itens: Item[]) {
  return itens.map((item) => {
    const cadastro = catalogoEmbalagens.find(([nome]) => nome.toLowerCase() === item.nome.toLowerCase())
    if (!cadastro) return item
    const [, unidadeEstoque, quantidadePorEmbalagem, unidadeConteudo, categoria] = cadastro
    return { ...item, categoria, unidadeEstoque, quantidadePorEmbalagem, unidadeConteudo }
  })
}

export function getEstoque(): Item[] {
  if (typeof window === "undefined") return enriquecerItens(defaultItens)
  const stored = localStorage.getItem(ESTOQUE_KEY)
  return enriquecerItens(stored ? JSON.parse(stored) : defaultItens)
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

export function getReceitas(): Receita[] {
  if (typeof window === "undefined") return defaultReceitas
  const stored = localStorage.getItem(RECEITAS_KEY)
  return stored ? JSON.parse(stored) : defaultReceitas
}

export function saveReceitas(receitas: Receita[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(RECEITAS_KEY, JSON.stringify(receitas))
}


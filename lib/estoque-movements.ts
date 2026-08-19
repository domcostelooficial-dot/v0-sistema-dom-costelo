import type { Insumo, MovimentacaoEstoque, UnidadeInsumo } from "./types"

export type UsuarioMovimentacao = { id: string; email: string }

export function converterBase(quantidade: number, unidade: UnidadeInsumo) {
  if (unidade === "kg") return { quantidade: quantidade * 1000, unidade: "g" as const }
  if (unidade === "l") return { quantidade: quantidade * 1000, unidade: "ml" as const }
  return { quantidade, unidade: unidade as "g" | "ml" | "un" | "m" }
}

export function criarEntrada(params: { insumo: Insumo; quantidade: number; unidade: UnidadeInsumo; precoUnitario: number; fornecedor?: string; observacao?: string; usuario: UsuarioMovimentacao; origem?: "compras" | "estoque"; agora?: string }): MovimentacaoEstoque {
  const base = converterBase(params.quantidade, params.unidade)
  return { id: crypto.randomUUID(), tipo: "entrada", insumoId: params.insumo.id ?? params.insumo.nome, insumoNomeSnapshot: params.insumo.nome, quantidade: params.quantidade, unidadeSnapshot: params.unidade, quantidadeBase: base.quantidade, unidadeBase: base.unidade, precoUnitarioSnapshot: params.precoUnitario, valorTotal: params.quantidade * params.precoUnitario, fornecedor: params.fornecedor, observacao: params.observacao, origem: params.origem ?? "estoque", status: "efetivada", usuarioId: params.usuario.id, usuarioEmail: params.usuario.email, criadoEm: params.agora ?? new Date().toISOString() }
}

export function criarEstorno(movimentacao: MovimentacaoEstoque, usuario: UsuarioMovimentacao, agora = new Date().toISOString()): MovimentacaoEstoque {
  return { ...movimentacao, id: crypto.randomUUID(), tipo: "estorno_entrada", quantidade: -Math.abs(movimentacao.quantidade), quantidadeBase: -Math.abs(movimentacao.quantidadeBase), valorTotal: -Math.abs(movimentacao.valorTotal), movimentacaoOrigemId: movimentacao.id, status: "efetivada", usuarioId: usuario.id, usuarioEmail: usuario.email, criadoEm: agora }
}

export function podeEstornar(movimentacao: MovimentacaoEstoque, saldoAtual: number) {
  return movimentacao.tipo === "entrada" && movimentacao.status === "efetivada" && saldoAtual >= movimentacao.quantidadeBase
}

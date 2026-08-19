import type { Insumo, MovimentacaoEstoque, UnidadeInsumo } from "./types"

export type UsuarioMovimentacao = { id: string; email?: string; nome?: string }

export function converterBase(quantidade: number, unidade: UnidadeInsumo) {
  if (unidade === "kg") return { quantidade: quantidade * 1000, unidade: "g" as const }
  if (unidade === "l") return { quantidade: quantidade * 1000, unidade: "ml" as const }
  return { quantidade, unidade: unidade as "g" | "ml" | "un" | "m" }
}

export function criarEntrada(params: { insumo: Insumo; quantidade: number; unidade: UnidadeInsumo; precoUnitario: number; fornecedor?: string; observacao?: string; usuario: UsuarioMovimentacao; origem?: "compras" | "estoque"; dataMovimentacao?: string; agora?: string }): MovimentacaoEstoque {
  const base = converterBase(params.quantidade, params.unidade)
  const criadoEm = params.agora ?? new Date().toISOString()
  return { id: crypto.randomUUID(), tipo: "entrada", insumoId: params.insumo.id ?? params.insumo.nome, insumoNomeSnapshot: params.insumo.nome, quantidade: params.quantidade, unidadeSnapshot: params.unidade, quantidadeBase: base.quantidade, unidadeBase: base.unidade, precoUnitarioSnapshot: params.precoUnitario, valorTotal: params.quantidade * params.precoUnitario, precoTotal: params.quantidade * params.precoUnitario, fornecedor: params.fornecedor, observacao: params.observacao, origem: params.origem ?? "estoque", status: "efetivada", usuarioId: params.usuario.id, usuarioEmail: params.usuario.email ?? "", criadoPorUid: params.usuario.id, criadoPorEmail: params.usuario.email, criadoPorNome: params.usuario.nome, dataMovimentacao: params.dataMovimentacao ?? criadoEm, criadoEm }
}

export function criarSaida(params: { insumo: Insumo; quantidade: number; unidade: UnidadeInsumo; motivo: NonNullable<MovimentacaoEstoque["motivo"]>; observacao?: string; usuario: UsuarioMovimentacao; agora?: string }): MovimentacaoEstoque {
  const base = converterBase(params.quantidade, params.unidade)
  const agora = params.agora ?? new Date().toISOString()
  return { id: crypto.randomUUID(), tipo: "saida", insumoId: params.insumo.id ?? params.insumo.nome, insumoNomeSnapshot: params.insumo.nome, quantidade: -Math.abs(params.quantidade), unidadeSnapshot: params.unidade, quantidadeBase: -Math.abs(base.quantidade), unidadeBase: base.unidade, precoUnitarioSnapshot: 0, valorTotal: 0, origem: "estoque", motivo: params.motivo, observacao: params.observacao, status: "ativa", usuarioId: params.usuario.id, usuarioEmail: params.usuario.email ?? "Usuário autenticado", criadoPorUid: params.usuario.id, criadoPorEmail: params.usuario.email, criadoPorNome: params.usuario.nome, dataMovimentacao: agora, criadoEm: agora }
}

export function criarEstorno(movimentacao: MovimentacaoEstoque, usuario: UsuarioMovimentacao, agora = new Date().toISOString()): MovimentacaoEstoque {
  return { ...movimentacao, id: crypto.randomUUID(), tipo: "estorno_entrada", quantidade: -Math.abs(movimentacao.quantidade), quantidadeBase: -Math.abs(movimentacao.quantidadeBase), valorTotal: -Math.abs(movimentacao.valorTotal), precoTotal: -Math.abs(movimentacao.precoTotal ?? movimentacao.valorTotal), movimentacaoOrigemId: movimentacao.id, movimentacaoOriginalId: movimentacao.id, unidade: movimentacao.unidadeSnapshot, status: "efetivada", usuarioId: usuario.id, usuarioEmail: usuario.email ?? "Usuário autenticado", criadoPorUid: usuario.id, criadoPorEmail: usuario.email, criadoPorNome: usuario.nome, dataMovimentacao: agora, criadoEm: agora }
}

export function podeEstornar(movimentacao: MovimentacaoEstoque, saldoAtual: number) {
  return movimentacao.tipo === "entrada" && movimentacao.status === "efetivada" && saldoAtual >= movimentacao.quantidadeBase
}

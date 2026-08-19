import type { FichaTecnica, Insumo } from "./types"

export type CanalVenda = "balcao" | "delivery" | "ifood" | "whatsapp" | "outro"

export interface FinanceConfig {
  taxas: Record<CanalVenda, number>
  custosFixosMensais: number
  metaFaturamentoMensal: number
  diasOperacaoMes: number
  ticketMedio: number
}

export interface VendaFinanceira {
  id: string
  data: string
  canal: CanalVenda
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitario: number
  faturamentoBruto: number
  taxaPercentual: number
  valorTaxa: number
  cmvUnitario: number
  cmvTotal: number
  faturamentoLiquido: number
  margemContribuicao: number
}

export interface DespesaFinanceira {
  id: string
  data: string
  categoria: string
  descricao: string
  valor: number
  recorrente: boolean
}

export const defaultFinanceConfig: FinanceConfig = {
  taxas: { balcao: 0, delivery: 0, ifood: 0, whatsapp: 0, outro: 0 },
  custosFixosMensais: 0,
  metaFaturamentoMensal: 0,
  diasOperacaoMes: 26,
  ticketMedio: 0,
}

export function toMoney(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function calcularTaxa(valorBruto: number, percentual: number) {
  return toMoney(valorBruto) * Math.max(0, percentual) / 100
}

export function calcularVenda(input: Omit<VendaFinanceira, "faturamentoBruto" | "taxaPercentual" | "valorTaxa" | "cmvTotal" | "faturamentoLiquido" | "margemContribuicao">, config: FinanceConfig): VendaFinanceira {
  const faturamentoBruto = toMoney(input.precoUnitario) * Math.max(0, input.quantidade)
  const taxaPercentual = Math.max(0, config.taxas[input.canal] ?? 0)
  const valorTaxa = calcularTaxa(faturamentoBruto, taxaPercentual)
  const cmvTotal = toMoney(input.cmvUnitario) * Math.max(0, input.quantidade)
  const faturamentoLiquido = faturamentoBruto - valorTaxa
  return { ...input, faturamentoBruto, taxaPercentual, valorTaxa, cmvTotal, faturamentoLiquido, margemContribuicao: faturamentoLiquido - cmvTotal }
}

export function resumoFinanceiro(vendas: VendaFinanceira[], despesas: DespesaFinanceira[]) {
  const faturamentoBruto = vendas.reduce((sum, venda) => sum + venda.faturamentoBruto, 0)
  const taxas = vendas.reduce((sum, venda) => sum + venda.valorTaxa, 0)
  const cmv = vendas.reduce((sum, venda) => sum + venda.cmvTotal, 0)
  const despesasOperacionais = despesas.reduce((sum, despesa) => sum + toMoney(despesa.valor), 0)
  const faturamentoLiquido = faturamentoBruto - taxas
  const margemContribuicao = faturamentoLiquido - cmv
  const margemPercentual = faturamentoLiquido > 0 ? margemContribuicao / faturamentoLiquido * 100 : 0
  const lucroOperacional = margemContribuicao - despesasOperacionais
  return { faturamentoBruto, taxas, cmv, faturamentoLiquido, margemContribuicao, margemPercentual, despesasOperacionais, lucroOperacional }
}

export function custoFicha(ficha: FichaTecnica, insumos: Insumo[]) {
  return ficha.ingredientes.reduce((total, ingrediente) => {
    const insumo = insumos.find((item) => item.id === ingrediente.insumoId || item.nome.toLowerCase() === ingrediente.insumoNome.toLowerCase())
    if (!insumo) return total
    const unidade = insumo.unidadeEmbalagem || insumo.unidade
    const quantidade = ingrediente.quantidade / Math.max(insumo.quantidadeEmbalagem || 1, 0.0001)
    return total + quantidade * insumo.precoCompra * (ingrediente.unidade === unidade ? 1 : 1)
  }, 0)
}

export function pontoEquilibrio(custosFixos: number, margemContribuicaoPercentual: number, ticketMedio: number) {
  if (custosFixos <= 0 || margemContribuicaoPercentual <= 0 || ticketMedio <= 0) return { faturamento: 0, pedidos: 0 }
  const faturamento = custosFixos / (margemContribuicaoPercentual / 100)
  return { faturamento, pedidos: Math.ceil(faturamento / ticketMedio) }
}

export function projetarMeta(metaMensal: number, diasOperacao: number, diasDecorridos: number, faturamentoAtual: number) {
  const metaDiaria = diasOperacao > 0 ? metaMensal / diasOperacao : 0
  const projetado = diasDecorridos > 0 ? faturamentoAtual / diasDecorridos * diasOperacao : 0
  return { metaDiaria, projetado, percentualMeta: metaMensal > 0 ? faturamentoAtual / metaMensal * 100 : 0 }
}

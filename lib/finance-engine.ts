import type { FichaTecnica, Insumo } from "./types"
import { calcularFicha } from "./cmv-engine"

export type CanalVenda = "salao" | "retirada" | "delivery_proprio" | "99food" | "outro" | "balcao" | "delivery" | "ifood" | "whatsapp"
export type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito"
export type TipoDespesa = "fixa" | "variavel" | "extraordinaria"
export type StatusVenda = "ativa" | "cancelada"

export interface TaxaConfig { taxaPercentual: number; taxaFixa: number }
export interface FinanceConfig {
  taxasPagamento: Record<FormaPagamento, number>
  taxasCanal: Partial<Record<CanalVenda, TaxaConfig>>
  /** Campos legados aceitos apenas para leitura/migração compatível. */
  taxas: Record<string, number>
  custosFixosMensais?: number
  metaFaturamentoMensal?: number
  diasOperacaoMes?: number
  ticketMedio?: number
  cmvMetaPercentual: number
  metaLucroMensal: number
  diasFuncionamento: Record<string, boolean>
  despesasFixas: Array<{ id: string; descricao: string; categoria: string; valor: number; ativo?: boolean }>
}
export interface VendaFinanceira {
  id: string; data: string; status: StatusVenda; canalNaVenda: CanalVenda; formaPagamentoNaVenda: FormaPagamento
  produtoId: string; produtoNome: string; quantidade: number; precoUnitarioNaVenda: number; desconto: number
  valorBruto: number; valorVenda: number; taxaPagamentoPercentual: number; taxaPagamentoValor: number
  taxaCanalPercentual: number; taxaCanalValor: number; taxaPercentualNaVenda: number; taxaFixaNaVenda: number
  taxaValorNaVenda: number; taxaTotalValor: number; receitaLiquida: number; cmvUnitarioNaVenda: number
  cmvTotalNaVenda: number; margemContribuicao: number; createdAt: string; createdBy?: string
  /** Aliases somente para leitura de registros antigos. */
  precoUnitario?: number; faturamentoBruto?: number; taxaPercentual?: number; valorTaxa?: number; cmvUnitario?: number; cmvTotal?: number; faturamentoLiquido?: number; canal?: CanalVenda
}
export interface DespesaFinanceira {
  id: string; descricao: string; categoria: string; valor: number; tipo: TipoDespesa; dataPagamento: string
  competencia: string; recorrente: boolean; observacao?: string; createdAt: string; createdBy?: string
}

export const defaultFinanceConfig: FinanceConfig = {
  taxasPagamento: { dinheiro: 0, pix: 0.99, debito: 1.66, credito: 3.56 },
  taxas: { salao: 0, retirada: 0, delivery_proprio: 0, "99food": 3.2, outro: 0, balcao: 0, delivery: 0, ifood: 3.2, whatsapp: 0 },
  taxasCanal: { salao: { taxaPercentual: 0, taxaFixa: 0 }, retirada: { taxaPercentual: 0, taxaFixa: 0 }, delivery_proprio: { taxaPercentual: 0, taxaFixa: 0 }, "99food": { taxaPercentual: 3.2, taxaFixa: 0 }, outro: { taxaPercentual: 0, taxaFixa: 0 } },
  cmvMetaPercentual: 40, metaLucroMensal: 0,
  diasFuncionamento: { segunda: true, terca: true, quarta: false, quinta: false, sexta: true, sabado: true, domingo: true },
  despesasFixas: [
    { id: "aluguel", descricao: "Aluguel", categoria: "Ocupação", valor: 2000 },
    { id: "energia", descricao: "Energia", categoria: "Utilidades", valor: 500 },
    { id: "agua", descricao: "Água", categoria: "Utilidades", valor: 400 },
    { id: "internet", descricao: "Internet", categoria: "Sistemas", valor: 100 },
    { id: "auxiliar-cozinha", descricao: "Auxiliar de cozinha", categoria: "Funcionários", valor: 2000 },
    { id: "entregador", descricao: "Entregador", categoria: "Entrega", valor: 1540 },
    { id: "marketing", descricao: "Marketing", categoria: "Marketing", valor: 1100 },
    { id: "brendi", descricao: "Brendi", categoria: "Sistemas", valor: 300 },
    { id: "estrutura-entrega", descricao: "Taxa/estrutura de entrega", categoria: "Entrega", valor: 800 },
    { id: "gas", descricao: "Gás", categoria: "Utilidades", valor: 550 },
    { id: "segundo-auxiliar", descricao: "Segundo auxiliar", categoria: "Funcionários", valor: 2000 },
  ],
}
const n = (v: number | undefined) => Number.isFinite(v) ? v as number : 0
export const calcularTaxa = (valor: number, percentual: number, fixa = 0) => Math.max(0, valor) * Math.max(0, percentual) / 100 + Math.max(0, fixa)
export const custoFichaOficial = (ficha: FichaTecnica, insumos: Insumo[]) => calcularFicha(ficha, insumos).cmv

export function calcularVenda(input: { id: string; data: string; canal: CanalVenda; formaPagamento?: FormaPagamento; produtoId: string; produtoNome: string; quantidade: number; precoUnitario: number; cmvUnitario: number; desconto?: number; createdBy?: string }, config: FinanceConfig): VendaFinanceira {
  const quantidade = Math.max(0, input.quantidade), valorBruto = Math.max(0, input.precoUnitario) * quantidade
  const desconto = Math.min(valorBruto, Math.max(0, input.desconto || 0)), valorVenda = valorBruto - desconto
  const formaPagamento = input.formaPagamento || "dinheiro"
  const canalNormalizado: CanalVenda = input.canal === "ifood" ? "99food" : input.canal === "balcao" ? "salao" : input.canal === "delivery" ? "delivery_proprio" : input.canal
  const pagamentoPct = config.taxasPagamento[formaPagamento] || 0
  const legacyChannel = input.canal === "ifood" || input.canal === "balcao" || input.canal === "delivery" || input.canal === "whatsapp"
  const canal = legacyChannel ? { taxaPercentual: config.taxas?.[input.canal] || 0, taxaFixa: 0 } : (config.taxasCanal[canalNormalizado] || { taxaPercentual: 0, taxaFixa: 0 })
  const usaTaxaExclusivaDoCanal = canalNormalizado === "99food"
  const taxaPagamentoAplicada = usaTaxaExclusivaDoCanal ? 0 : pagamentoPct
  const taxaPagamentoValor = calcularTaxa(valorVenda, taxaPagamentoAplicada), taxaCanalValor = calcularTaxa(valorVenda, canal.taxaPercentual, canal.taxaFixa)
  const taxaTotalValor = taxaPagamentoValor + taxaCanalValor, cmvTotalNaVenda = Math.max(0, input.cmvUnitario) * quantidade
  const receitaLiquida = valorVenda - taxaTotalValor
  return { id: input.id, data: input.data, status: "ativa", canalNaVenda: canalNormalizado, formaPagamentoNaVenda: formaPagamento, produtoId: input.produtoId, produtoNome: input.produtoNome, quantidade, precoUnitarioNaVenda: input.precoUnitario, desconto, valorBruto, valorVenda, taxaPagamentoPercentual: taxaPagamentoAplicada, taxaPagamentoValor, taxaCanalPercentual: canal.taxaPercentual, taxaCanalValor, taxaPercentualNaVenda: taxaPagamentoAplicada + canal.taxaPercentual, taxaFixaNaVenda: canal.taxaFixa, taxaValorNaVenda: taxaTotalValor, taxaTotalValor, receitaLiquida, cmvUnitarioNaVenda: input.cmvUnitario, cmvTotalNaVenda, margemContribuicao: receitaLiquida - cmvTotalNaVenda, createdAt: input.data, createdBy: input.createdBy, canal: input.canal, precoUnitario: input.precoUnitario, faturamentoBruto: valorBruto, taxaPercentual: taxaPagamentoAplicada + canal.taxaPercentual, valorTaxa: taxaTotalValor, cmvUnitario: input.cmvUnitario, cmvTotal: cmvTotalNaVenda, faturamentoLiquido: receitaLiquida }
}

export function resumoFinanceiro(vendas: VendaFinanceira[], despesas: DespesaFinanceira[], custosFixosConfigurados = 0) {
  const ativas = vendas.filter(v => v.status !== "cancelada")
  const faturamentoBruto = ativas.reduce((s, v) => s + n(v.valorBruto ?? v.precoUnitarioNaVenda * v.quantidade), 0)
  const descontos = ativas.reduce((s, v) => s + n(v.desconto), 0), taxas = ativas.reduce((s, v) => s + n(v.taxaTotalValor ?? v.valorTaxa), 0)
  const receitaLiquida = faturamentoBruto - descontos - taxas, cmv = ativas.reduce((s, v) => s + n(v.cmvTotalNaVenda ?? v.cmvTotal), 0)
  const variaveis = despesas.filter(d => d.tipo === "variavel").reduce((s, d) => s + n(d.valor), 0)
  const fixas = despesas.filter(d => !d.tipo || d.tipo === "fixa").reduce((s, d) => s + n(d.valor), 0)
  const extraordinarias = despesas.filter(d => d.tipo === "extraordinaria").reduce((s, d) => s + n(d.valor), 0)
  const lucroBruto = receitaLiquida - cmv, margemContribuicao = lucroBruto - variaveis, mcPercentual = faturamentoBruto > 0 ? margemContribuicao / faturamentoBruto * 100 : 0
  const custosFixosFinais = custosFixosConfigurados > 0 ? custosFixosConfigurados : fixas
  return { faturamentoBruto, descontos, taxas, receitaLiquida, cmv, lucroBruto, despesasVariaveis: variaveis, custosFixos: custosFixosFinais, despesasExtraordinarias: extraordinarias, margemContribuicao, mcPercentual, lucroOperacional: margemContribuicao - custosFixosFinais - extraordinarias, ticketMedio: ativas.length ? faturamentoBruto / ativas.length : 0, numeroVendas: ativas.length }
}
export function pontoEquilibrio(custosFixos: number, mcPercentual: number, ticketMedio = 0, diasAbertos = 0) { const faturamento = custosFixos > 0 && mcPercentual > 0 ? custosFixos / (mcPercentual / 100) : 0; return { faturamento, diario: diasAbertos > 0 ? faturamento / diasAbertos : 0, pedidos: ticketMedio > 0 ? Math.ceil(faturamento / ticketMedio) : 0 } }
export function contarDiasAbertos(mes: Date, dias: Record<string, boolean>) { const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate(); const nomes = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"]; return Array.from({ length: total }, (_, i) => nomes[new Date(mes.getFullYear(), mes.getMonth(), i + 1).getDay()]).filter(d => dias[d] === true).length }
export function filtrarPeriodo(vendas: VendaFinanceira[], despesas: DespesaFinanceira[], inicio: string, fim: string) {
  const inicioMes = inicio.slice(0, 7), fimMes = fim.slice(0, 7)
  return {
    vendas: vendas.filter(v => v.status !== "cancelada" && v.data.slice(0, 10) >= inicio && v.data.slice(0, 10) <= fim),
    despesas: despesas.filter(d => (d.competencia || d.dataPagamento.slice(0, 7)) >= inicioMes && (d.competencia || d.dataPagamento.slice(0, 7)) <= fimMes),
  }
}
export function projetarMeta(vendas: VendaFinanceira[], config: FinanceConfig, hoje = new Date()) { const totalDias = contarDiasAbertos(hoje, config.diasFuncionamento), realizados = Array.from({ length: hoje.getDate() }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), i + 1)).filter(d => config.diasFuncionamento[["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][d.getDay()]] === true).length; const bruto = resumoFinanceiro(vendas, []).faturamentoBruto; return { projetado: realizados ? bruto / realizados * totalDias : 0, diasAbertos: totalDias, realizados } }
export function classificarCmv(percentual: number, meta = 40) { return percentual <= meta ? "dentro da meta" : percentual <= meta + 5 ? "atenção" : "crítico" }
export { calcularFicha }
export const custoFicha = custoFichaOficial
export const toMoney = n
export const calcularMargemContribuicao = (receita: number, cmv: number, variaveis: number) => n(receita) - n(cmv) - n(variaveis)
export const projetarFaturamento = (vendas: VendaFinanceira[], config: FinanceConfig) => projetarMeta(vendas, config).projetado
export const calcularPontoEquilibrio = pontoEquilibrio
export const formatarMoeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const calcularResumoFinanceiro = resumoFinanceiro
export const resumoDRE = resumoFinanceiro
export const calcularVendaFinanceira = calcularVenda
export const calcularTaxaPercentual = calcularTaxa
export const custoProduto = custoFichaOficial
export const calcularPontoEquilibrioDiario = (pe: number, dias: number) => dias > 0 ? pe / dias : 0
export const calcularFaturamentoMetaLucro = (custos: number, lucro: number, mc: number) => mc > 0 ? (custos + lucro) / (mc / 100) : 0
export const diferencaPontoEquilibrio = (pe: number, atual: number) => Math.max(0, pe - atual)
export const progressoPontoEquilibrio = (pe: number, atual: number) => pe > 0 ? Math.min(100, atual / pe * 100) : 0
export const produtoAbaixoDoCusto = (receita: number, cmv: number) => receita < cmv
export const taxaFormaPagamento = (v: number, p: number) => calcularTaxa(v, p)
export const taxaCanalVenda = (v: number, p: number, fixa = 0) => calcularTaxa(v, p, fixa)
export const arredondarMoeda = (v: number) => Math.round(v * 100) / 100
export const semDados = (v: number) => !Number.isFinite(v) || v === 0
export const normalizarValor = n
export const validarQuantidade = (v: number) => Number.isFinite(v) && v > 0
export const validarPercentual = (v: number) => Number.isFinite(v) && v >= 0
export const calcularTaxasTotais = (v: VendaFinanceira[]) => v.filter(x => x.status !== "cancelada").reduce((s, x) => s + x.taxaTotalValor, 0)
export const calcularCmvTotal = (v: VendaFinanceira[]) => v.filter(x => x.status !== "cancelada").reduce((s, x) => s + x.cmvTotalNaVenda, 0)
export const calcularReceitaLiquida = (v: VendaFinanceira[]) => v.filter(x => x.status !== "cancelada").reduce((s, x) => s + x.receitaLiquida, 0)
export const calcularMargemPercentual = (mc: number, bruto: number) => bruto > 0 ? mc / bruto * 100 : 0
export const calcularTicketMedio = (bruto: number, qtd: number) => qtd > 0 ? bruto / qtd : 0
export const calcularTaxa99Food = (v: number, config: FinanceConfig) => calcularTaxa(v, config.taxasCanal["99food"]?.taxaPercentual ?? config.taxas?.["99food"] ?? 0)
export const isVendaAtiva = (v: VendaFinanceira) => v.status !== "cancelada"
export const dataCompetencia = (d: string) => d.slice(0, 7)
export const atualizarStatusVenda = (v: VendaFinanceira, status: StatusVenda) => ({ ...v, status })
export const canaisFinanceiros: Array<[CanalVenda, string]> = [["salao", "Salão"], ["retirada", "Retirada"], ["delivery_proprio", "Delivery próprio / Link próprio"], ["99food", "99Food"], ["outro", "Outro"]]
export const formasPagamento: Array<[FormaPagamento, string]> = [["dinheiro", "Dinheiro"], ["pix", "Pix"], ["debito", "Débito"], ["credito", "Crédito"]]

export interface RentabilidadeProduto {
  produtoId: string; produtoNome: string; quantidade: number; faturamento: number; cmvTotal: number; taxas: number; margemContribuicao: number; mcPercentual: number
}

export function rentabilidadePorProduto(vendas: VendaFinanceira[]): RentabilidadeProduto[] {
  const grupos = new Map<string, RentabilidadeProduto>()
  vendas.filter(isVendaAtiva).forEach((venda) => {
    const atual = grupos.get(venda.produtoId) ?? { produtoId: venda.produtoId, produtoNome: venda.produtoNome, quantidade: 0, faturamento: 0, cmvTotal: 0, taxas: 0, margemContribuicao: 0, mcPercentual: 0 }
    atual.quantidade += n(venda.quantidade)
    atual.faturamento += n(venda.valorBruto)
    atual.cmvTotal += n(venda.cmvTotalNaVenda)
    atual.taxas += n(venda.taxaTotalValor)
    atual.margemContribuicao += n(venda.margemContribuicao)
    grupos.set(venda.produtoId, atual)
  })
  return Array.from(grupos.values()).map((produto) => ({ ...produto, mcPercentual: produto.faturamento > 0 ? produto.margemContribuicao / produto.faturamento * 100 : 0 }))
}

export function totalCustosFixosAtivos(config: FinanceConfig) {
  return (config.despesasFixas ?? []).reduce((total, despesa) => total + (despesa.ativo !== false ? n(despesa.valor) : 0), 0)
}

export function totalCustosFixos(config: FinanceConfig, despesas: DespesaFinanceira[] = []) {
  const detalhadas = totalCustosFixosAtivos(config)
  const registradas = despesas.filter((despesa) => despesa.tipo === "fixa").reduce((total, despesa) => total + n(despesa.valor), 0)
  return detalhadas || registradas || n(config.custosFixosMensais)
}

export function percentualCmv(resumo: ReturnType<typeof resumoFinanceiro>) { return resumo.faturamentoBruto > 0 ? resumo.cmv / resumo.faturamentoBruto * 100 : 0 }

export type StatusHomologacao = "ok" | "divergente" | "sem-dados"

export interface FinanceAuditSnapshot {
  competencia: string
  fonte: "vendas-importadas" | "vendas-registradas" | "sem-dados"
  versaoGabarito: "julho-2026-v1"
  verificadoEm: string
  totalVendas: number | null
  faturamentoBruto: number | null
  descontos: number | null
  receitaAposDescontos: number | null
  taxas: number | null
  receitaLiquida: number | null
  cmv: number | null
  cmvPercentual: number | null
  margemContribuicao: number | null
  mcPercentual: number | null
  custosFixos: number | null
  resultadoOperacional: number | null
  margemOperacionalPercentual: number | null
  ticketMedio: number | null
  pontoEquilibrio: number | null
  observacao?: string
}

export const GABARITO_JULHO_2026 = {
  competencia: "2026-07", faturamentoBruto: 26609.46, descontos: 184.73, receitaAposDescontos: 26424.73,
  taxas: 2000.00, receitaLiquida: 24424.73, cmv: 11350.00, cmvPercentual: 42.65,
  margemContribuicao: 13074.73, mcPercentual: 49.14, custosFixos: 11290.00,
  resultadoOperacional: 1784.73, margemOperacionalPercentual: 6.71, totalVendas: 357,
  ticketMedio: 74.54, pontoEquilibrio: 22970.00, origem: "homologacao_julho_2026", tipo: "gabarito_historico",
} as const

export function criarAuditoriaFinanceira(vendas: VendaFinanceira[], despesas: DespesaFinanceira[], config: FinanceConfig, competencia: string): FinanceAuditSnapshot {
  const inicio = `${competencia}-01`
  const fimDate = new Date(Number(competencia.slice(0, 4)), Number(competencia.slice(5, 7)), 0)
  const fim = `${competencia}-${String(fimDate.getDate()).padStart(2, "0")}`
  const filtrado = filtrarPeriodo(vendas, despesas, inicio, fim)
  const fonte = filtrado.vendas.length > 0 ? "vendas-registradas" : "sem-dados"
  if (fonte === "sem-dados") return { competencia, fonte, versaoGabarito: "julho-2026-v1", verificadoEm: new Date().toISOString(), totalVendas: null, faturamentoBruto: null, descontos: null, receitaAposDescontos: null, taxas: null, receitaLiquida: null, cmv: null, cmvPercentual: null, margemContribuicao: null, mcPercentual: null, custosFixos: null, resultadoOperacional: null, margemOperacionalPercentual: null, ticketMedio: null, pontoEquilibrio: null, observacao: "Sem vendas registradas; nenhuma venda foi inventada." }
  const resumo = resumoFinanceiro(filtrado.vendas, filtrado.despesas, totalCustosFixosAtivos(config))
  const receitaAposDescontos = resumo.faturamentoBruto - resumo.descontos
  const cmvPercentual = resumo.faturamentoBruto > 0 ? resumo.cmv / resumo.faturamentoBruto * 100 : null
  const mcPercentual = resumo.faturamentoBruto > 0 ? resumo.margemContribuicao / resumo.faturamentoBruto * 100 : null
  const margemOperacionalPercentual = resumo.faturamentoBruto > 0 ? resumo.lucroOperacional / resumo.faturamentoBruto * 100 : null
  const pontoEquilibrioValor = resumo.mcPercentual > 0 ? resumo.custosFixos / (resumo.mcPercentual / 100) : null
  return { competencia, fonte, versaoGabarito: "julho-2026-v1", verificadoEm: new Date().toISOString(), totalVendas: resumo.numeroVendas, faturamentoBruto: resumo.faturamentoBruto, descontos: resumo.descontos, receitaAposDescontos, taxas: resumo.taxas, receitaLiquida: resumo.receitaLiquida, cmv: resumo.cmv, cmvPercentual, margemContribuicao: resumo.margemContribuicao, mcPercentual, custosFixos: resumo.custosFixos, resultadoOperacional: resumo.lucroOperacional, margemOperacionalPercentual, ticketMedio: resumo.ticketMedio, pontoEquilibrio: pontoEquilibrioValor }
}

export const CAMPOS_GABARITO = ["faturamentoBruto", "descontos", "receitaAposDescontos", "taxas", "receitaLiquida", "cmv", "cmvPercentual", "margemContribuicao", "mcPercentual", "custosFixos", "resultadoOperacional", "margemOperacionalPercentual", "totalVendas", "ticketMedio", "pontoEquilibrio"] as const
export const CAMPOS_CRITICOS = ["faturamentoBruto", "taxas", "cmv", "custosFixos", "resultadoOperacional"] as const

export function compararAuditoriaComEsperado(realizado: FinanceAuditSnapshot, esperado: Partial<FinanceAuditSnapshot>, tolerancia = 0.01) {
  return CAMPOS_GABARITO.reduce((resultado, campo) => { const calculado = realizado[campo]; const valorEsperado = esperado[campo]; return { ...resultado, [campo]: calculado === null ? null : Math.abs(calculado - (valorEsperado ?? calculado)) <= (campo.includes("Percentual") || campo === "cmvPercentual" || campo === "mcPercentual" ? 0.01 : tolerancia) } }, {} as Record<(typeof CAMPOS_GABARITO)[number], boolean | null>)
}

export function statusAuditoria(comparacao: Record<string, boolean | null>): StatusHomologacao { if (Object.values(comparacao).some(value => value === null)) return "sem-dados"; return Object.values(comparacao).every(Boolean) ? "ok" : "divergente" }

export function fluxoCaixaPago(despesas: DespesaFinanceira[], inicio: string, fim: string) {
  return despesas.filter((despesa) => despesa.dataPagamento.slice(0, 10) >= inicio && despesa.dataPagamento.slice(0, 10) <= fim).reduce((total, despesa) => total + n(despesa.valor), 0)
}

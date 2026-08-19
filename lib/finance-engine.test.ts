import { describe, expect, it } from "vitest"
import { calcularTaxa, calcularVenda, pontoEquilibrio, resumoFinanceiro, filtrarPeriodo, contarDiasAbertos, totalCustosFixos, totalCustosFixosAtivos, criarAuditoriaFinanceira, compararAuditoriaComEsperado, fluxoCaixaPago, GABARITO_JULHO_2026, statusAuditoria } from "./finance-engine"
import { defaultFinanceConfig } from "./finance-engine"

describe("motor financeiro", () => {
  it("calcula taxa e venda por canal", () => {
    const venda = calcularVenda({ id: "1", data: "2026-08-19", canal: "ifood", produtoId: "p1", produtoNome: "Produto", quantidade: 2, precoUnitario: 30, cmvUnitario: 8 }, { ...defaultFinanceConfig, taxas: { ...defaultFinanceConfig.taxas, ifood: 20 } })
    expect(venda.faturamentoBruto).toBe(60)
    expect(venda.valorTaxa).toBe(12)
    expect(venda.cmvTotal).toBe(16)
    expect(venda.margemContribuicao).toBe(32)
  })

  it("resume DRE sem vender", () => {
    const resumo = resumoFinanceiro([], [{ id: "d1", data: "2026-08-19", categoria: "Aluguel", descricao: "Aluguel", valor: 2000, recorrente: true }])
    expect(resumo.faturamentoBruto).toBe(0)
    expect(resumo.lucroOperacional).toBe(-2000)
  })

  it("calcula ponto de equilíbrio com entradas válidas", () => {
    expect(pontoEquilibrio(5000, 50, 40)).toEqual({ faturamento: 10000, diario: 0, pedidos: 250 })
    expect(pontoEquilibrio(0, 50, 40)).toEqual({ faturamento: 0, diario: 0, pedidos: 0 })
  })

  it("não gera taxa negativa", () => {
    expect(calcularTaxa(100, -10)).toBe(0)
  })

  it.each([["dinheiro", 0], ["pix", 0.99], ["debito", 1.66], ["credito", 3.56]] as const)("calcula taxa de salão: %s", (forma, taxa) => {
    const venda = calcularVenda({ id: forma, data: "2026-08-19", canal: "salao", formaPagamento: forma, produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 }, defaultFinanceConfig)
    expect(venda.taxaTotalValor).toBe(taxa)
    expect(venda.receitaLiquida).toBe(100 - taxa)
  })

  it("99Food não soma a taxa Pix", () => {
    const venda = calcularVenda({ id: "99", data: "2026-08-19", canal: "99food", formaPagamento: "pix", produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 }, defaultFinanceConfig)
    expect(venda.taxaTotalValor).toBe(3.2)
    expect(venda.receitaLiquida).toBe(96.8)
    expect(venda.taxaPagamentoValor).toBe(0)
  })

  it("filtra julho e agosto e exclui cancelada", () => {
    const base = { produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 } as const
    const julho = calcularVenda({ ...base, id: "j", data: "2026-07-31", canal: "salao" }, defaultFinanceConfig)
    const agosto = calcularVenda({ ...base, id: "a", data: "2026-08-01", canal: "salao", precoUnitario: 200 }, defaultFinanceConfig)
    const cancelada = { ...agosto, id: "c", status: "cancelada" as const }
    const result = filtrarPeriodo([julho, agosto, cancelada], [], "2026-08-01", "2026-08-31")
    expect(result.vendas.map(v => v.id)).toEqual(["a"])
  })

  it("calcula PE diário pelos dias abertos", () => {
    expect(pontoEquilibrio(10000, 50, 0, 22).diario).toBeCloseTo(909.09, 2)
    expect(contarDiasAbertos(new Date("2026-08-01T12:00:00"), { segunda: true, terca: true, quarta: false, quinta: false, sexta: true, sabado: true, domingo: true })).toBeGreaterThan(0)
  })

  it("usa custos fixos detalhados como fonte única", () => {
    const config = { ...defaultFinanceConfig, despesasFixas: [{ id: "aluguel", descricao: "Aluguel", categoria: "Ocupação", valor: 2000 }] }
    expect(totalCustosFixos(config, [{ id: "duplicada", descricao: "Aluguel antigo", categoria: "Ocupação", valor: 999, tipo: "fixa", dataPagamento: "2026-08-01", competencia: "2026-08", recorrente: true, createdAt: "2026-08-01" }])).toBe(2000)
    const venda = calcularVenda({ id: "c", data: "2026-08-19", canal: "salao", formaPagamento: "pix", produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 }, config)
    expect(resumoFinanceiro([venda], [], totalCustosFixos(config)).custosFixos).toBe(2000)
  })

  it("não transforma dias fechados em abertos", () => {
    expect(contarDiasAbertos(new Date("2026-08-01T12:00:00"), { segunda: true, terca: false, quarta: false, quinta: false, sexta: false, sabado: false, domingo: false })).toBe(5)
  })

  it("dashboard mensal exclui vendas de meses anteriores", () => {
    const julho = calcularVenda({ id: "julho", data: "2026-07-31", canal: "salao", produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 }, defaultFinanceConfig)
    const agosto = calcularVenda({ id: "agosto", data: "2026-08-01", canal: "salao", produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 200, cmvUnitario: 40 }, defaultFinanceConfig)
    const mes = filtrarPeriodo([julho, agosto], [], "2026-08-01", "2026-08-31")
    expect(resumoFinanceiro(mes.vendas, []).faturamentoBruto).toBe(200)
  })

  it("considera legado sem ativo como ativo e ignora inativo", () => {
    const config = { ...defaultFinanceConfig, despesasFixas: [{ id: "a", descricao: "Aluguel", categoria: "Ocupação", valor: 2000 }, { id: "e", descricao: "Energia", categoria: "Utilidades", valor: 500, ativo: true }, { id: "i", descricao: "Internet", categoria: "Sistemas", valor: 100, ativo: false }] }
    expect(totalCustosFixosAtivos(config)).toBe(2500)
  })

  it("altera o PE quando um custo é desativado", () => {
    const ativo = { ...defaultFinanceConfig, despesasFixas: [{ id: "a", descricao: "Aluguel", categoria: "Ocupação", valor: 2000, ativo: true }, { id: "s", descricao: "Segundo auxiliar", categoria: "Funcionários", valor: 2000, ativo: true }] }
    const inativo = { ...ativo, despesasFixas: ativo.despesasFixas.map(item => item.id === "s" ? { ...item, ativo: false } : item) }
    expect(pontoEquilibrio(totalCustosFixosAtivos(ativo), 50).faturamento).toBe(8000)
    expect(pontoEquilibrio(totalCustosFixosAtivos(inativo), 50).faturamento).toBe(4000)
  })

  it("não gera infinito com todos os custos inativos", () => {
    const config = { ...defaultFinanceConfig, despesasFixas: defaultFinanceConfig.despesasFixas.map(item => ({ ...item, ativo: false })) }
    expect(totalCustosFixosAtivos(config)).toBe(0)
    expect(pontoEquilibrio(0, 0).faturamento).toBe(0)
  })

  it("homologa julho sem inventar vendas", () => {
    const venda = calcularVenda({ id: "julho", data: "2026-07-15", canal: "salao", formaPagamento: "pix", produtoId: "p", produtoNome: "Produto", quantidade: 1, precoUnitario: 100, cmvUnitario: 40 }, defaultFinanceConfig)
    const audit = criarAuditoriaFinanceira([venda], [], defaultFinanceConfig, "2026-07")
    expect(audit.totalVendas).toBe(1)
    expect(audit.faturamentoBruto).toBe(100)
    expect(compararAuditoriaComEsperado(audit, { faturamentoBruto: 100 }).faturamentoBruto).toBe(true)
    expect(fluxoCaixaPago([{ id: "d", descricao: "Conta", categoria: "Utilidades", valor: 50, tipo: "fixa", dataPagamento: "2026-08-01", competencia: "2026-07", recorrente: false, createdAt: "2026-08-01" }], "2026-07-01", "2026-07-31")).toBe(0)
  })

  it("homologação vazia não cria dados", () => {
    const audit = criarAuditoriaFinanceira([], [], defaultFinanceConfig, "2026-07")
    expect(audit.totalVendas).toBeNull()
    expect(audit.fonte).toBe("sem-dados")
    expect(audit.observacao).toContain("nenhuma venda foi inventada")
  })

  it("mantém gabarito oficial de julho versionado", () => {
    expect(GABARITO_JULHO_2026.faturamentoBruto).toBe(26609.46)
    expect(GABARITO_JULHO_2026.descontos).toBe(184.73)
    expect(GABARITO_JULHO_2026.taxas).toBe(2000)
    expect(GABARITO_JULHO_2026.cmv).toBe(11350)
    expect(GABARITO_JULHO_2026.custosFixos).toBe(11290)
    expect(GABARITO_JULHO_2026.resultadoOperacional).toBe(1784.73)
    expect(GABARITO_JULHO_2026.totalVendas).toBe(357)
    const audit = criarAuditoriaFinanceira([], [], defaultFinanceConfig, "2026-07")
    const status = statusAuditoria(compararAuditoriaComEsperado(audit, GABARITO_JULHO_2026))
    expect(status).toBe("sem-dados")
  })

  it("aprova comparação dentro da tolerância de um centavo", () => {
    const audit = { ...criarAuditoriaFinanceira([], [], defaultFinanceConfig, "2026-07"), totalVendas: 357, faturamentoBruto: 100, descontos: 0, receitaAposDescontos: 100, taxas: 0, receitaLiquida: 100, cmv: 0, cmvPercentual: 0, margemContribuicao: 100, mcPercentual: 100, custosFixos: 0, resultadoOperacional: 100, margemOperacionalPercentual: 100, ticketMedio: 100, pontoEquilibrio: 0 }
    expect(statusAuditoria(compararAuditoriaComEsperado(audit, { ...GABARITO_JULHO_2026, faturamentoBruto: 100, descontos: 0, receitaAposDescontos: 100, taxas: 0, receitaLiquida: 100, cmv: 0, cmvPercentual: 0, margemContribuicao: 100, mcPercentual: 100, custosFixos: 0, resultadoOperacional: 100, margemOperacionalPercentual: 100, totalVendas: 357, ticketMedio: 100, pontoEquilibrio: 0 }))).toBe("ok")
  })

  it("classifica divergência e diferença negativa", () => {
    const audit = { ...criarAuditoriaFinanceira([], [], defaultFinanceConfig, "2026-07"), totalVendas: 357, faturamentoBruto: 90, descontos: 0, receitaAposDescontos: 90, taxas: 0, receitaLiquida: 90, cmv: 0, cmvPercentual: 0, margemContribuicao: 90, mcPercentual: 100, custosFixos: 0, resultadoOperacional: 90, margemOperacionalPercentual: 100, ticketMedio: 90, pontoEquilibrio: 0 }
    const comparacao = compararAuditoriaComEsperado(audit, { ...GABARITO_JULHO_2026, faturamentoBruto: 100, descontos: 0, receitaAposDescontos: 90, taxas: 0, receitaLiquida: 90, cmv: 0, cmvPercentual: 0, margemContribuicao: 90, mcPercentual: 100, custosFixos: 0, resultadoOperacional: 90, margemOperacionalPercentual: 100, totalVendas: 357, ticketMedio: 90, pontoEquilibrio: 0 })
    expect(comparacao.faturamentoBruto).toBe(false)
    expect(statusAuditoria(comparacao)).toBe("divergente")
    expect(audit.faturamentoBruto! - 100).toBe(-10)
  })

  it("classifica todos os contadores sem confundir false com true", () => {
    const comparacao = { faturamentoBruto: true, cmv: false, custosFixos: null }
    expect(Object.values(comparacao).filter(value => value === true)).toHaveLength(1)
    expect(Object.values(comparacao).filter(value => value === false)).toHaveLength(1)
    expect(Object.values(comparacao).filter(value => value === null)).toHaveLength(1)
    expect(statusAuditoria(comparacao)).toBe("sem-dados")
  })

  it("formata diferença negativa sem perder o sinal", () => {
    const esperado = 26609.46
    const calculado = 25000
    expect(calculado - esperado).toBeLessThan(0)
    expect(`${calculado - esperado}`).toContain("-")
  })

  it("deriva o ponto de equilíbrio com o índice MC integral", () => {
    const indiceMc = 13074.73 / 26609.46
    const peEsperado = 11290 / indiceMc
    expect(GABARITO_JULHO_2026.pontoEquilibrio).toBeCloseTo(peEsperado, 2)
    expect(GABARITO_JULHO_2026.pontoEquilibrio).not.toBe(22970)
  })

  it("mapeia os três estados visuais da homologação", () => {
    expect(statusAuditoria({ indicador: true })).toBe("ok")
    expect(statusAuditoria({ indicador: false })).toBe("divergente")
    expect(statusAuditoria({ indicador: null })).toBe("sem-dados")
  })
})

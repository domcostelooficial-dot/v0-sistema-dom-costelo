import { describe, expect, it } from "vitest"
import { calcularTaxa, calcularVenda, pontoEquilibrio, resumoFinanceiro } from "./finance-engine"
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
    expect(pontoEquilibrio(5000, 50, 40)).toEqual({ faturamento: 10000, pedidos: 250 })
    expect(pontoEquilibrio(0, 50, 40)).toEqual({ faturamento: 0, pedidos: 0 })
  })

  it("não gera taxa negativa", () => {
    expect(calcularTaxa(100, -10)).toBe(0)
  })
})

import { describe, expect, it } from "vitest"
import { criarEntrada, criarEstorno, podeEstornar } from "./estoque-movements"
import type { Insumo, MovimentacaoEstoque } from "./types"

const insumo: Insumo = { id: "batata", nome: "Batata", categoria: "Batatas/congelados", unidade: "kg", unidadeCompra: "kg", precoCompra: 20, quantidadeEmbalagem: 2, unidadeEmbalagem: "kg", unidadeConteudo: "kg", quantidadeConteudo: 2, custoUnitario: 10, min: 0, atual: 0 }

describe("movimentações de estoque", () => {
  it("cria entrada com snapshot e conversão de base", () => {
    const movimento = criarEntrada({ insumo, quantidade: 2, unidade: "kg", precoUnitario: 20, fornecedor: "Fornecedor A", usuario: { id: "u1", email: "a@dom.com" }, agora: "2026-01-01T10:00:00.000Z" })
    expect(movimento.insumoId).toBe("batata")
    expect(movimento.quantidadeBase).toBe(2000)
    expect(movimento.unidadeBase).toBe("g")
    expect(movimento.valorTotal).toBe(40)
  })

  it("cria estorno inverso sem apagar a origem", () => {
    const origem = criarEntrada({ insumo, quantidade: 2, unidade: "kg", precoUnitario: 20, usuario: { id: "u1", email: "a@dom.com" }, agora: "2026-01-01T10:00:00.000Z" })
    const estorno = criarEstorno(origem, { id: "u2", email: "b@dom.com" }, "2026-01-02T10:00:00.000Z")
    expect(estorno.movimentacaoOrigemId).toBe(origem.id)
    expect(estorno.quantidade).toBe(-2)
    expect(origem.status).toBe("efetivada")
  })

  it("bloqueia estorno com saldo insuficiente ou origem já estornada", () => {
    const movimento = { ...criarEntrada({ insumo, quantidade: 2, unidade: "kg", precoUnitario: 20, usuario: { id: "u1", email: "a@dom.com" } }), status: "efetivada" } as MovimentacaoEstoque
    expect(podeEstornar(movimento, 1999)).toBe(false)
    expect(podeEstornar({ ...movimento, status: "estornada" }, 2000)).toBe(false)
  })
})

import { describe, expect, it } from "vitest"
import { calcularFicha, custoIngrediente, custoPorUnidade } from "./cmv-engine"
import type { FichaTecnica, Insumo } from "./types"

const mussarela: Insumo = {
  id: "mussarela",
  nome: "Mussarela",
  unidade: "kg",
  unidadeEmbalagem: "kg",
  quantidadeEmbalagem: 1,
  precoCompra: 43,
  custoUnitario: 43,
}

describe("CMV", () => {
  it("calcula custo por grama e ingrediente sem dividir pela quantidade de ingredientes", () => {
    expect(custoPorUnidade(mussarela)).toBe(0.043)
    expect(custoIngrediente({ insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, [mussarela])).toBeCloseTo(1.075)
  })

  it("calcula CMV, lucro, margem e markup", () => {
    const ficha: FichaTecnica = { id: "teste", nome: "Teste", precoVenda: 10, embalagem: 1, ingredientes: [{ insumoNome: "Mussarela", quantidade: 25, unidade: "g" }] }
    const result = calcularFicha(ficha, [mussarela])
    expect(result.cmv).toBeCloseTo(2.075)
    expect(result.cmvPercentual).toBeCloseTo(20.75)
    expect(result.margem).toBeCloseTo(7.925)
    expect(result.margemPercentual).toBeCloseTo(79.25)
    expect(result.markup).toBeCloseTo(10 / 2.075)
  })

  it("não cria percentuais para preço ou CMV inválidos", () => {
    const semPreco = calcularFicha({ id: "sem-preco", nome: "Sem preço", precoVenda: 0, ingredientes: [] }, [])
    const semCusto = calcularFicha({ id: "sem-custo", nome: "Sem custo", precoVenda: 10, ingredientes: [] }, [])
    expect(semPreco.cmvPercentual).toBeNull()
    expect(semPreco.markup).toBeNull()
    expect(semCusto.markup).toBeNull()
    expect(custoIngrediente({ insumoNome: "Inexistente", quantidade: 10, unidade: "g" }, [])).toBe(0)
  })
})

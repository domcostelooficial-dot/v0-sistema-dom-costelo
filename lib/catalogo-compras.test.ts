import { describe, expect, it } from "vitest"
import { catalogoCompletoCompras } from "./compras-engine"
import type { Insumo, Item } from "./types"

const central = (overrides: Partial<Insumo>): Insumo => ({ id: "base", nome: "Batata", categoria: "Congelados", unidade: "kg", unidadeCompra: "kg", precoCompra: 20, quantidadeEmbalagem: 2, quantidadeConteudo: 2, unidadeEmbalagem: "kg", unidadeConteudo: "kg", custoUnitario: 10, min: 0, atual: 0, ...overrides })
const estoque = (overrides: Partial<Item>): Item => ({ nome: "Produto", categoria: "Outros", min: 0, atual: 1, ...overrides })

describe("catalogoCompletoCompras", () => {
  it("prioriza insumoId e não duplica", () => {
    const result = catalogoCompletoCompras([estoque({ nome: "Outro nome", insumoId: "insumo-a" } as Item)], [central({ id: "insumo-a", nome: "Batata" })])
    expect(result).toHaveLength(1)
    expect(result[0].nome).toBe("Batata")
  })

  it("resolve nome canônico e alias", () => {
    const result = catalogoCompletoCompras([estoque({ nome: "Carne de hambúrguer" })], [central({ id: "blend", nome: "Carne de hambúrguer / Blend 180g", aliases: ["Carne de hambúrguer"] })])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("blend")
  })

  it("marca item desconhecido sem promovê-lo a cadastro central", () => {
    const result = catalogoCompletoCompras([estoque({ nome: "Produto completamente novo" })], [central({ id: "batata", nome: "Batata" })])
    const item = result.find((entry) => entry.nome === "Produto completamente novo")
    expect(item?.naoVinculado).toBe(true)
    expect(item?.origem).toBe("estoque")
    expect(result.filter((entry) => entry.naoVinculado).length).toBe(1)
  })

  it("mantém bacon em cubos e fatiado separados", () => {
    const result = catalogoCompletoCompras([], [central({ id: "cubos", nome: "Bacon em cubos" }), central({ id: "fatiado", nome: "Bacon fatiado" })])
    expect(result.map((entry) => entry.id)).toEqual(expect.arrayContaining(["cubos", "fatiado"]))
  })
})

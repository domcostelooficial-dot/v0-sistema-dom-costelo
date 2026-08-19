import { describe, expect, it } from "vitest"
import { catalogoCompletoCompras } from "../lib/compras-engine"
import type { Insumo, Item } from "../lib/types"

const insumo = (nome: string): Insumo => ({ nome, categoria: "Mercearia", unidade: "un", precoCompra: 10, quantidadeEmbalagem: 1, unidadeEmbalagem: "un", custoUnitario: 10, min: 1, atual: 0 })

describe("catálogo da lista de compras", () => {
  it("inclui todos os itens do estoque além dos insumos cadastrados", () => {
    const resultado = catalogoCompletoCompras([{ nome: "Item do estoque", min: 2, atual: 0, categoria: "Operacional" }], [insumo("Insumo cadastrado")])
    expect(resultado.map((item) => item.nome)).toEqual(["Insumo cadastrado", "Item do estoque"])
  })

  it("deduplica nomes sem perder o insumo com preço configurado", () => {
    const resultado = catalogoCompletoCompras([{ nome: "  bacon ", min: 2, atual: 1, categoria: "Carnes" } as Item], [insumo("Bacon")])
    expect(resultado).toHaveLength(1)
    expect(resultado[0].precoCompra).toBe(10)
  })
})

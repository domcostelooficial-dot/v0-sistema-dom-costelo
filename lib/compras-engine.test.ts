import { describe, expect, it } from "vitest"
import { converterParaUnidadeBase, normalizarUnidadeCompra } from "./compras-engine"

describe("unidades de compra", () => {
  it("normaliza g, grama e gramas para g", () => {
    expect(normalizarUnidadeCompra("g")).toBe("g")
    expect(normalizarUnidadeCompra("grama")).toBe("g")
    expect(normalizarUnidadeCompra("gramas")).toBe("g")
  })

  it("converte kg para g", () => {
    expect(converterParaUnidadeBase(1, "kg")).toEqual({ quantidade: 1000, unidade: "g" })
  })

  it("mantém blend 180g como embalagem unitária com conteúdo em g", () => {
    expect(converterParaUnidadeBase(180, "g")).toEqual({ quantidade: 180, unidade: "g" })
  })

  it("converte embalagens de 1,5kg e 2kg para conteúdo em gramas", () => {
    expect(converterParaUnidadeBase(1.5, "kg")).toEqual({ quantidade: 1500, unidade: "g" })
    expect(converterParaUnidadeBase(2, "kg")).toEqual({ quantidade: 2000, unidade: "g" })
  })
})

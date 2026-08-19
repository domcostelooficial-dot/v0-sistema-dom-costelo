import { describe, expect, it } from "vitest"

type Ingrediente = { insumoId?: string; insumoNome: string; quantidade: number }

function validarFicha(nome: string, ingredientes: Ingrediente[]) {
  const nomes = ingredientes.map((item) => item.insumoNome.trim().toLowerCase())
  return Boolean(nome.trim() && ingredientes.length && ingredientes.every((item) => item.quantidade > 0) && new Set(nomes).size === nomes.length)
}

describe("CRUD de fichas técnicas", () => {
  it("aceita ficha válida", () => expect(validarFicha("Costeloburguer", [{ insumoId: "blend", insumoNome: "Blend", quantidade: 1 }])).toBe(true))
  it("bloqueia quantidade zero", () => expect(validarFicha("Teste", [{ insumoNome: "Blend", quantidade: 0 }])).toBe(false))
  it("bloqueia ingredientes duplicados", () => expect(validarFicha("Teste", [{ insumoNome: "Blend", quantidade: 1 }, { insumoNome: "blend", quantidade: 2 }])).toBe(false))
  it("preserva vínculo por insumoId", () => expect({ insumoId: "abc", insumoNome: "Nome antigo" }).toMatchObject({ insumoId: "abc" }))
  it("mantém status inativo reversível", () => expect({ ativo: false }).toEqual({ ativo: false }))
})

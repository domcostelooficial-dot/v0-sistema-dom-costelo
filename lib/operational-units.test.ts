import { describe, expect, it } from "vitest"
import { calcularValorEstoque } from "./compras-engine"
import { calcularFicha, custoIngrediente, ingredientesPendentes } from "./cmv-engine"
import type { FichaTecnica, Insumo } from "./types"

const insumo = (partial: Partial<Insumo>): Insumo => ({ nome: "Teste", min: 0, atual: 0, categoria: "Mercearia", unidade: "kg", unidadeCompra: "kg", unidadeBase: "g", precoCompra: 0, quantidadeEmbalagem: 1, unidadeEmbalagem: "kg", unidadeConteudo: "kg", custoUnitario: 0, ...partial })

describe("unidades operacionais", () => {
  it("calcula Bacon R$32/kg com uso de 40g", () => expect(custoIngrediente({ insumoNome: "Bacon", quantidade: 40, unidade: "g" }, [insumo({ nome: "Bacon", precoCompra: 32 })])).toBeCloseTo(1.28))
  it("calcula Mussarela R$43/kg com uso de 25g", () => expect(custoIngrediente({ insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, [insumo({ nome: "Mussarela", precoCompra: 43 })])).toBeCloseTo(1.075))
  it("calcula Costela R$80/kg com uso de 40g", () => expect(custoIngrediente({ insumoNome: "Costela", quantidade: 40, unidade: "g" }, [insumo({ nome: "Costela", precoCompra: 80 })])).toBeCloseTo(3.2))
  it("calcula Cream cheese R$60 por pacote de 1,5kg com uso de 30g", () => expect(custoIngrediente({ insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, [insumo({ nome: "Cream cheese", unidade: "pacote", unidadeCompra: "pacote", unidadeEmbalagem: "kg", unidadeConteudo: "kg", quantidadeEmbalagem: 1.5, precoCompra: 60 })])).toBeCloseTo(1.2))
  it("calcula Batata R$20 por pacote de 2kg com uso de 400g", () => expect(custoIngrediente({ insumoNome: "Batata", quantidade: 400, unidade: "g" }, [insumo({ nome: "Batata", unidade: "pacote", unidadeCompra: "pacote", unidadeEmbalagem: "kg", unidadeConteudo: "kg", quantidadeEmbalagem: 2, precoCompra: 20 })])).toBeCloseTo(4))
  it("calcula Blend por unidade sem dividir pelo conteúdo", () => expect(custoIngrediente({ insumoNome: "Blend", quantidade: 1, unidade: "un" }, [insumo({ nome: "Blend", unidade: "un", unidadeCompra: "un", unidadeEmbalagem: "un", unidadeConteudo: "g", quantidadeEmbalagem: 180, precoCompra: 6.35 })])).toBeCloseTo(6.35))
  it("calcula estoque de 7 pacotes de batata por R$20", () => expect(calcularValorEstoque(insumo({ unidade: "pacote", unidadeCompra: "pacote", unidadeEmbalagem: "kg", unidadeConteudo: "kg", quantidadeEmbalagem: 2, precoCompra: 20 }), 7)).toBe(140))
  it("calcula estoque de 3 pacotes de cream cheese por R$60", () => expect(calcularValorEstoque(insumo({ unidade: "pacote", unidadeCompra: "pacote", unidadeEmbalagem: "kg", unidadeConteudo: "kg", quantidadeEmbalagem: 1.5, precoCompra: 60 }), 3)).toBe(180))
  it("marca ingrediente inexistente como custo pendente", () => { const ficha: FichaTecnica = { id: "x", nome: "X", precoVenda: 20, ingredientes: [{ insumoNome: "Inexistente", quantidade: 10, unidade: "g" }] }; expect(ingredientesPendentes(ficha, [])).toEqual(["Inexistente"]); expect(calcularFicha(ficha, []).custoPendente).toBe(true) })
})

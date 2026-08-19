import { describe, expect, it } from "vitest"
import { calcularFicha, calcularConsumoVenda, converterQuantidadeFichaParaEstoque, custoIngrediente, custoPorUnidade, resolverIngredientesFicha } from "./cmv-engine"
import { defaultInsumos } from "./types"
import type { FichaTecnica, IngredienteFicha, Insumo } from "./types"

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
  it("resolve ingrediente por ID, nome e alias exato", () => {
    const insumos = [{ ...mussarela, aliases: ["Queijo mussarela"] }]
    expect(resolverIngredientesFicha({ id: "f", nome: "Ficha", precoVenda: 0, ingredientes: [{ insumoNome: "Queijo mussarela", quantidade: 1, unidade: "g" }] }, insumos).ok).toBe(true)
    expect(resolverIngredientesFicha({ id: "f", nome: "Ficha", precoVenda: 0, ingredientes: [{ insumoNome: "Farofa de bacon", quantidade: 1, unidade: "g" }] }, insumos).ok).toBe(false)
  })

  it("audita os valores mestres e custos de porção", () => {
    const custo = (nome: string, quantidade: number, unidade: string) => custoIngrediente({ insumoNome: nome, quantidade, unidade: unidade as IngredienteFicha["unidade"] }, defaultInsumos)
    expect(custo("Carne de hambúrguer", 180, "g")).toBeCloseTo(6.66)
    expect(custo("Costela suína", 1, "kg")).toBeCloseTo(25)
    expect(custo("Costela bovina", 1, "kg")).toBeCloseTo(35)
    expect(custo("Costela Desfiada", 40, "g")).toBeCloseTo(3.2)
    expect(custo("Bacon fatiado", 40, "g")).toBeCloseTo(1.28)
    expect(custo("Batata frita", 400, "g")).toBeCloseTo(4)
    expect(custo("Mussarela", 200, "g")).toBeCloseTo(8.6)
    expect(custo("Cream Cheese", 30, "g")).toBeCloseTo(1.2)
    expect(custo("Farofa de bacon", 80, "g")).toBeCloseTo(4.4)
    expect(custo("Farofa", 50, "g")).toBeCloseTo(1)
    expect(custo("Arroz", 300, "g")).toBeCloseTo(1.2)
    expect(custo("Sal de parrilla", 20, "g")).toBeCloseTo(0.5)
    expect(custo("Pimenta Biquinho", 20, "g")).toBeCloseTo(1.2)
    expect(custo("Onion Rings", 160, "g")).toBeCloseTo(3.52)
    expect(custo("Embalagem H7", 1, "un")).toBeCloseTo(0.5)
    expect(custo("Embalagem H2", 1, "un")).toBeCloseTo(0.39)
    expect(custo("Tempero do Dom", 1, "aplicação")).toBeCloseTo(2)
  })

  it("calcula Carne de hambúrguer a R$37/kg com 180g por R$6,66", () => {
    const carne: Insumo = { ...mussarela, id: "carne-hamburguer-kg", nome: "Carne de hambúrguer", unidade: "kg", unidadeCompra: "kg", unidadeEmbalagem: "kg", unidadeConteudo: "kg", precoCompra: 37, quantidadeEmbalagem: 1 }
    expect(custoIngrediente({ insumoId: carne.id, insumoNome: carne.nome, quantidade: 180, unidade: "g" }, [carne])).toBeCloseTo(6.66)
    expect(custoIngrediente({ insumoId: carne.id, insumoNome: carne.nome, quantidade: 160, unidade: "g" }, [carne])).toBeCloseTo(5.92)
  })

  it("recalcula a carne quando o preço por kg muda para R$40", () => {
    const carne: Insumo = { ...mussarela, id: "carne-hamburguer-kg", nome: "Carne de hambúrguer", unidade: "kg", unidadeCompra: "kg", unidadeEmbalagem: "kg", unidadeConteudo: "kg", precoCompra: 40, quantidadeEmbalagem: 1 }
    expect(custoIngrediente({ insumoId: carne.id, insumoNome: carne.nome, quantidade: 180, unidade: "g" }, [carne])).toBeCloseTo(7.2)
  })

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

  it("mantém custos individuais sem calcular média", () => {
    const a: Insumo = { ...mussarela, id: "a", nome: "A", unidade: "un", unidadeEmbalagem: "un", precoCompra: 2, quantidadeEmbalagem: 1 }
    const b: Insumo = { ...mussarela, id: "b", nome: "B", unidade: "un", unidadeEmbalagem: "un", precoCompra: 6, quantidadeEmbalagem: 1 }
    expect(custoIngrediente({ insumoNome: "A", quantidade: 1, unidade: "un" }, [a, b])).toBe(2)
    expect(custoIngrediente({ insumoNome: "B", quantidade: 1, unidade: "un" }, [a, b])).toBe(6)
  })

  it("calcula consumo agregado por venda e converte unidade", () => {
    const ficha: FichaTecnica = { id: "hamb", nome: "Hambúrguer", precoVenda: 20, ingredientes: [{ insumoId: "mussarela", insumoNome: "Mussarela", quantidade: 25, unidade: "g" }] }
    const result = calcularConsumoVenda({ id: "v1", produtoNome: "Hambúrguer", quantidade: 4, fichaTecnicaId: "hamb" }, ficha, [mussarela], [{ id: "mussarela", insumoId: "mussarela", nome: "Mussarela", atual: 3, min: 0, categoria: "Queijos", unidadeEstoque: "kg" }])
    expect(result.ok).toBe(true)
    if (result.ok) { expect(result.consumos[0].quantidadeBase).toBeCloseTo(0.1); const tres = calcularConsumoVenda({ id: "v2", produtoNome: "Hambúrguer", quantidade: 3, fichaTecnicaId: "hamb" }, ficha, [mussarela], [{ id: "mussarela", insumoId: "mussarela", nome: "Mussarela", atual: 3, min: 0, categoria: "Queijos", unidadeEstoque: "kg" }]); expect(tres.ok && tres.consumos[0].quantidadeBase).toBeCloseTo(0.075) }
  })

  it("bloqueia ficha ausente ou insumo não vinculado", () => {
    expect(calcularConsumoVenda({ id: "v1", produtoNome: "X", quantidade: 1 }, undefined, []).ok).toBe(false)
    expect(calcularConsumoVenda({ id: "v1", produtoNome: "X", quantidade: 1 }, { id: "x", nome: "X", precoVenda: 1, ingredientes: [{ insumoId: "missing", insumoNome: "Não existe", quantidade: 1, unidade: "g" }] }, []).ok).toBe(false)
  })

  it("converte g para a unidade física real kg", () => {
    const itemEstoque = { id: "bacon", insumoId: "bacon", nome: "Bacon", atual: 2, min: 0, categoria: "Carnes", unidadeEstoque: "kg" as const }
    expect(converterQuantidadeFichaParaEstoque({ quantidadeFicha: 40, unidadeFicha: "g", insumo: { ...mussarela, id: "bacon", nome: "Bacon" }, itemEstoque })).toEqual({ quantidadeEstoque: 0.04, unidadeEstoque: "kg" })
  })

  it("converte g para pacote usando conteúdo da embalagem", () => {
    const itemEstoque = { id: "cream", insumoId: "cream", nome: "Cream Cheese", atual: 4, min: 0, categoria: "Laticínios", unidadeEstoque: "pacote" as const }
    const insumo = { ...mussarela, id: "cream", nome: "Cream Cheese", quantidadeConteudo: 1500, unidadeConteudo: "g" as const, unidadeEmbalagem: "pacote" as const }
    expect(converterQuantidadeFichaParaEstoque({ quantidadeFicha: 30, unidadeFicha: "g", insumo, itemEstoque }).quantidadeEstoque).toBeCloseTo(0.02)
  })

  it("preserva unidade física un e bloqueia pacote sem conteúdo", () => {
    const blend = { ...mussarela, id: "blend", nome: "Blend", unidade: "un" as const, unidadeEmbalagem: "un" as const }
    const unit = { id: "blend", insumoId: "blend", nome: "Blend", atual: 20, min: 0, categoria: "Carnes", unidadeEstoque: "un" as const }
    expect(converterQuantidadeFichaParaEstoque({ quantidadeFicha: 3, unidadeFicha: "un", insumo: blend, itemEstoque: unit })).toEqual({ quantidadeEstoque: 3, unidadeEstoque: "un" })
    expect(() => converterQuantidadeFichaParaEstoque({ quantidadeFicha: 30, unidadeFicha: "g", insumo: blend, itemEstoque: { ...unit, unidadeEstoque: "pacote" } })).toThrow("UNIDADE_INCOMPATIVEL")
  })

  it("não cria percentuais para preço ou CMV inválidos", () => {
    const semPreco = calcularFicha({ id: "sem-preco", nome: "Sem preço", precoVenda: 0, ingredientes: [] }, [])
    const semCusto = calcularFicha({ id: "sem-custo", nome: "Sem custo", precoVenda: 10, ingredientes: [] }, [])
    expect(semPreco.cmvPercentual).toBeNull()
    expect(semPreco.markup).toBeNull()
    expect(semCusto.markup).toBeNull()
    expect(custoIngrediente({ insumoNome: "Inexistente", quantidade: 10, unidade: "g" }, [])).toBe(0)
    expect(custoIngrediente({ insumoNome: "Mussarela", quantidade: 0, unidade: "g" }, [mussarela])).toBe(0)
    expect(Number.isFinite(custoPorUnidade({ ...mussarela, quantidadeEmbalagem: 0 }))).toBe(true)
  })
})

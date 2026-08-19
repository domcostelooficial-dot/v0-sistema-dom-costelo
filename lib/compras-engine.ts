import type { Insumo, Item } from "./types"

const normalizar = (i: Insumo): Insumo => ({ ...i, precoReferencia: i.precoReferencia ?? i.precoCompra, unidadeReferencia: i.unidadeReferencia ?? i.unidade, custoUnitario: (i.precoReferencia ?? i.precoCompra) / Math.max(i.quantidadeEmbalagem, 1) })

export function catalogoCompletoCompras(itens: Item[], insumos: Insumo[]): Insumo[] {
  const porNome = new Map<string, Insumo>()
  insumos.forEach((insumo) => porNome.set(insumo.nome.trim().toLocaleLowerCase("pt-BR"), normalizar(insumo)))
  itens.forEach((item) => {
    const chave = item.nome.trim().toLocaleLowerCase("pt-BR")
    if (porNome.has(chave)) return
    const unidade = (item.unidade ?? item.unidadeEstoque ?? item.unidadeEmbalagem ?? "un") as Insumo["unidade"]
    const preco = item.precoReferencia ?? item.precoCompra ?? item.preco ?? 0
    porNome.set(chave, normalizar({ ...item, unidade, categoria: (item.categoria || "Mercearia") as Insumo["categoria"], precoCompra: preco, quantidadeEmbalagem: item.quantidadeEmbalagem ?? 1, unidadeEmbalagem: (item.unidadeEmbalagem ?? unidade) as Insumo["unidadeEmbalagem"], custoUnitario: item.custoUnitario ?? preco } as Insumo))
  })
  return Array.from(porNome.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

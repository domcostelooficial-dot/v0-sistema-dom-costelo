import type { Insumo, Item, UnidadeInsumo } from "./types"

export type UnidadeCompraNormalizada = "g" | "kg" | "ml" | "l" | "un" | "pacote" | "caixa" | "bobina" | "maço" | "pct" | "aplicação"

export function normalizarUnidadeCompra(unidade?: string | null): UnidadeCompraNormalizada {
  const valor = (unidade ?? "un").trim().toLocaleLowerCase("pt-BR")
  if (["grama", "gramas", "gr", "g"].includes(valor)) return "g"
  if (["quilo", "quilos", "kilograma", "kilogramas", "kg"].includes(valor)) return "kg"
  if (["mililitro", "mililitros", "ml"].includes(valor)) return "ml"
  if (["litro", "litros", "l"].includes(valor)) return "l"
  if (["unidade", "unidades", "un"].includes(valor)) return "un"
  if (["pack", "pacote", "pacotes"].includes(valor)) return "pacote"
  if (["caixa", "caixas"].includes(valor)) return "caixa"
  if (["bobina", "bobinas"].includes(valor)) return "bobina"
  if (["maço", "maço", "maços"].includes(valor)) return "maço"
  if (["pct", "pcts"].includes(valor)) return "pct"
  return "aplicação"
}

export function converterParaUnidadeBase(quantidade: number, unidade?: string | null) {
  const normalizada = normalizarUnidadeCompra(unidade)
  if (normalizada === "kg") return { quantidade: quantidade * 1000, unidade: "g" as const }
  if (normalizada === "l") return { quantidade: quantidade * 1000, unidade: "ml" as const }
  return { quantidade, unidade: normalizada as UnidadeInsumo }
}

const normalizar = (i: Insumo): Insumo => {
  const unidadeCompra = normalizarUnidadeCompra(i.unidadeEmbalagem ?? i.unidadeReferencia ?? i.unidade)
  const conteudo = i.quantidadeEmbalagem ?? 1
  const base = converterParaUnidadeBase(conteudo, unidadeCompra)
  const preco = i.precoReferencia ?? i.precoCompra ?? 0
  return { ...i, unidade: (normalizarUnidadeCompra(i.unidade) as UnidadeInsumo), unidadeEmbalagem: unidadeCompra as UnidadeInsumo, quantidadeEmbalagem: conteudo, precoReferencia: preco, unidadeReferencia: unidadeCompra, unidadeConteudo: base.unidade, quantidadePorEmbalagem: base.quantidade, custoUnitario: preco / Math.max(conteudo, 1) }
}

export function catalogoCompletoCompras(itens: Item[], insumos: Insumo[]): Insumo[] {
  const porNome = new Map<string, Insumo>()
  insumos.forEach((insumo) => porNome.set(insumo.nome.trim().toLocaleLowerCase("pt-BR"), normalizar(insumo)))
  itens.forEach((item) => {
    const chave = item.nome.trim().toLocaleLowerCase("pt-BR")
    if (porNome.has(chave)) return
    const unidade = normalizarUnidadeCompra(item.unidade ?? item.unidadeEstoque ?? item.unidadeEmbalagem ?? "un") as Insumo["unidade"]
    const unidadeEmbalagem = normalizarUnidadeCompra(item.unidadeEmbalagem ?? item.unidadeConteudo ?? unidade) as Insumo["unidadeEmbalagem"]
    const preco = item.precoReferencia ?? item.precoCompra ?? item.preco ?? 0
    const quantidadeEmbalagem = item.quantidadeEmbalagem ?? item.quantidadePorEmbalagem ?? 1
    porNome.set(chave, normalizar({ ...item, unidade, categoria: (item.categoria || "Mercearia") as Insumo["categoria"], precoCompra: preco, quantidadeEmbalagem, unidadeEmbalagem, custoUnitario: item.custoUnitario ?? preco } as Insumo))
  })
  return Array.from(porNome.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

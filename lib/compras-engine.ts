import type { Insumo, Item, UnidadeInsumo } from "./types"

export type UnidadeCompraNormalizada = "kg" | "ml" | "l" | "un" | "pacote" | "caixa" | "bobina" | "maço" | "pct" | "aplicação"
export type UnidadeConteudoNormalizada = "g" | "kg" | "ml" | "l" | "m" | "un"

export function normalizarUnidadeCompra(unidade?: string | null): UnidadeCompraNormalizada {
  const valor = (unidade ?? "un").trim().toLocaleLowerCase("pt-BR")
  if (["quilo", "quilos", "kilograma", "kilogramas", "kg"].includes(valor)) return "kg"
  if (["mililitro", "mililitros", "ml"].includes(valor)) return "ml"
  if (["litro", "litros", "l"].includes(valor)) return "l"
  if (["unidade", "unidades", "un"].includes(valor)) return "un"
  if (["pack", "pacote", "pacotes"].includes(valor)) return "pacote"
  if (["caixa", "caixas"].includes(valor)) return "caixa"
  if (["bobina", "bobinas"].includes(valor)) return "bobina"
  if (["maço", "maços"].includes(valor)) return "maço"
  if (["pct", "pcts"].includes(valor)) return "pct"
  return "aplicação"
}

export function normalizarUnidadeConteudo(unidade?: string | null): UnidadeConteudoNormalizada {
  const valor = (unidade ?? "un").trim().toLocaleLowerCase("pt-BR")
  if (["grama", "gramas", "gr", "g"].includes(valor)) return "g"
  if (["quilo", "quilos", "kilograma", "kilogramas", "kg"].includes(valor)) return "kg"
  if (["mililitro", "mililitros", "ml"].includes(valor)) return "ml"
  if (["litro", "litros", "l"].includes(valor)) return "l"
  if (["metro", "metros", "m"].includes(valor)) return "m"
  return "un"
}

export function converterParaUnidadeBase(quantidade: number, unidade?: string | null) {
  const normalizada = normalizarUnidadeConteudo(unidade)
  if (normalizada === "kg") return { quantidade: quantidade * 1000, unidade: "g" as const }
  if (normalizada === "l") return { quantidade: quantidade * 1000, unidade: "ml" as const }
  return { quantidade, unidade: normalizada as UnidadeInsumo }
}

const normalizar = (i: Insumo): Insumo => {
  const unidadeCompra = normalizarUnidadeCompra(i.unidadeCompra ?? i.unidadeReferencia ?? i.unidade)
  const unidadeConteudo = normalizarUnidadeConteudo(i.unidadeConteudo ?? i.unidadeEmbalagem ?? i.unidade)
  const conteudo = i.quantidadeConteudo ?? i.quantidadeEmbalagem ?? 1
  const base = converterParaUnidadeBase(conteudo, unidadeConteudo)
  const preco = i.precoReferencia ?? i.precoCompra ?? 0
  return { ...i, unidade: (normalizarUnidadeConteudo(i.unidade) as UnidadeInsumo), unidadeCompra: unidadeCompra as UnidadeInsumo, unidadeEmbalagem: unidadeConteudo as UnidadeInsumo, quantidadeConteudo: conteudo, quantidadeEmbalagem: conteudo, precoReferencia: preco, unidadeReferencia: unidadeCompra as "g" | "un" | "kg" | "ml" | "l", unidadeConteudo: unidadeConteudo as "g" | "un" | "kg" | "ml" | "l", unidadeBase: base.unidade as "g" | "un" | "kg" | "ml" | "l", quantidadePorEmbalagem: base.quantidade, custoUnitario: preco / Math.max(conteudo, 1) }
}

export function calcularValorEstoque(insumo: Insumo | Item, quantidadeAtual = insumo.atual ?? 0): number {
  const preco = insumo.precoCompra ?? insumo.precoReferencia ?? insumo.preco ?? 0
  const unidadeCompra = ("unidadeCompra" in insumo ? insumo.unidadeCompra : undefined) ?? insumo.unidadeEmbalagem ?? insumo.unidade ?? "un"
  if (["pacote", "caixa", "bobina", "pct"].includes(unidadeCompra)) return quantidadeAtual * preco
  return quantidadeAtual * preco
}

export function catalogoCompletoCompras(itens: Item[], insumos: Insumo[]): Insumo[] {
  const porNome = new Map<string, Insumo>()
  const normalizarChave = (valor: string) => valor.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ")
  const porId = new Map(insumos.filter((insumo) => insumo.id).map((insumo) => [insumo.id as string, normalizar(insumo)]))
  insumos.forEach((insumo) => { const central = normalizar(insumo); porNome.set(normalizarChave(central.nome), central); (central.aliases ?? []).forEach((alias) => { if (!porNome.has(normalizarChave(alias)) || !porNome.get(normalizarChave(alias))?.nome.includes("Bacon fatiado")) porNome.set(normalizarChave(alias), central) }) })
  itens.forEach((item) => {
    const chave = normalizarChave(item.nome)
    const vinculado = (item.id && porId.get(item.id)) || porNome.get(chave)
    if (vinculado) { porNome.set(chave, vinculado); return }
    const unidade = normalizarUnidadeCompra(item.unidade ?? item.unidadeEstoque ?? item.unidadeEmbalagem ?? "un") as Insumo["unidade"]
    const unidadeEmbalagem = normalizarUnidadeCompra(item.unidadeEmbalagem ?? item.unidadeConteudo ?? unidade) as Insumo["unidadeEmbalagem"]
    const preco = item.precoReferencia ?? item.precoCompra ?? item.preco ?? 0
    const quantidadeEmbalagem = item.quantidadeEmbalagem ?? item.quantidadePorEmbalagem ?? 1
    porNome.set(chave, normalizar({ ...item, unidade, categoria: (item.categoria || "Mercearia") as Insumo["categoria"], precoCompra: preco, quantidadeEmbalagem, unidadeEmbalagem, custoUnitario: item.custoUnitario ?? preco } as Insumo))
  })
  return Array.from(porNome.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

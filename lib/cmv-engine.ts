import type { FichaTecnica, Insumo, IngredienteFicha } from "./types"

const unitFactor: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1, unidade: 1, pacote: 1, caixa: 1, bobina: 1, "maço": 1, pct: 1, metro: 1, aplicação: 1 }

export function custoPorUnidade(insumo: Insumo) {
  const quantidade = Math.max(insumo.quantidadeEmbalagem || 1, 0.0001)
  const unidadeConteudo = insumo.unidadeConteudo || insumo.unidadeEmbalagem || insumo.unidade
  const fator = unitFactor[unidadeConteudo] || 1
  return insumo.precoCompra / (quantidade * fator)
}

export function converterQuantidade(quantidade: number, origem: string, destino: string) {
  const origemFactor = unitFactor[origem] || 1
  const destinoFactor = unitFactor[destino] || 1
  return quantidade * origemFactor / destinoFactor
}

export function localizarInsumo(ingrediente: IngredienteFicha, insumos: Insumo[]) {
  return insumos.find((item) => ingrediente.insumoId ? item.id === ingrediente.insumoId : item.nome.toLowerCase() === ingrediente.insumoNome.toLowerCase() || item.aliases?.some((alias) => alias.toLowerCase() === ingrediente.insumoNome.toLowerCase()))
}

export function custoIngrediente(ingrediente: IngredienteFicha, insumos: Insumo[]) {
  const insumo = localizarInsumo(ingrediente, insumos)
  if (!insumo) return 0
  const unidadeConteudo = insumo.unidadeConteudo || insumo.unidadeEmbalagem || insumo.unidade
  if ((insumo.unidadeCompra || insumo.unidade) === "un" && unidadeConteudo === "g" && ingrediente.unidade === "un") return ingrediente.quantidade * insumo.precoCompra
  const quantidadeNaEmbalagem = converterQuantidade(ingrediente.quantidade, ingrediente.unidade, unidadeConteudo) / Math.max(insumo.quantidadeEmbalagem || 1, 0.0001)
  return quantidadeNaEmbalagem * insumo.precoCompra
}

export function ingredientesPendentes(ficha: FichaTecnica, insumos: Insumo[]) {
  return ficha.ingredientes.filter((ingrediente) => !localizarInsumo(ingrediente, insumos)).map((ingrediente) => ingrediente.insumoNome)
}

export function calcularFicha(ficha: FichaTecnica, insumos: Insumo[]) {
  const pendentes = ingredientesPendentes(ficha, insumos)
  const ingredientes = ficha.ingredientes.reduce((total, ingrediente) => total + custoIngrediente(ingrediente, insumos), 0)
  const embalagens = ficha.embalagem || 0
  const cmv = ingredientes + embalagens
  const margem = ficha.precoVenda - cmv
  return { ingredientes, embalagens, cmv, pendentes, custoPendente: pendentes.length > 0, cmvPercentual: ficha.precoVenda > 0 ? cmv / ficha.precoVenda * 100 : null, margem, margemPercentual: ficha.precoVenda > 0 ? margem / ficha.precoVenda * 100 : null, markup: cmv > 0 && ficha.precoVenda > 0 ? ficha.precoVenda / cmv : null }
}

export function alertaCmv(percentual: number | null) {
  if (percentual === null) return { label: "Preço pendente", tone: "warning" as const }
  if (percentual <= 35) return { label: "Excelente", tone: "success" as const }
  if (percentual <= 40) return { label: "Atenção", tone: "warning" as const }
  if (percentual <= 45) return { label: "Alto", tone: "orange" as const }
  return { label: "Crítico", tone: "danger" as const }
}

export const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const formatPercent = (value: number | null) => value === null ? "Preço pendente" : `${value.toFixed(2).replace(".", ",")}%`
export const seedFichas: FichaTecnica[] = [
  { id: "super-bacon-bbq", nome: "Super Bacon BBQ", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer / Blend 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Bacon em cubos", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "costeloburguer", nome: "Costeloburguer", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer / Blend 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 5, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "donzao", nome: "Donzão", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer / Blend 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "dom-supreme", nome: "Dom Supreme", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer / Blend 180g", quantidade: 1, unidade: "un" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }] },
  { id: "costela-do-dom", nome: "Costela do Dom", precoVenda: 0, ingredientes: [{ insumoNome: "Costela suína", quantidade: 1, unidade: "kg" }, { insumoNome: "Tempero do Dom", quantidade: 1, unidade: "aplicação" }, { insumoNome: "Barbecue", quantidade: 100, unidade: "g" }, { insumoNome: "Alho torrado", quantidade: 40, unidade: "g" }, { insumoNome: "Pimenta Biquinho", quantidade: 20, unidade: "g" }] },
]
export function seedInsumos(base: Insumo[]) { return base }

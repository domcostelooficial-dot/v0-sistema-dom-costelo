import type { FichaTecnica, Insumo, IngredienteFicha } from "./types"

const unitFactor: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1, unidade: 1, pacote: 1, caixa: 1, bobina: 1, "maço": 1, pct: 1, metro: 1, aplicação: 1 }

export function custoPorUnidade(insumo: Insumo) {
  const quantidade = Math.max(insumo.quantidadeEmbalagem || 1, 0.0001)
  const fator = unitFactor[insumo.unidadeEmbalagem || insumo.unidade || "un"] || 1
  return insumo.precoCompra / (quantidade * fator)
}

export function converterQuantidade(quantidade: number, origem: string, destino: string) {
  const origemFactor = unitFactor[origem] || 1
  const destinoFactor = unitFactor[destino] || 1
  return quantidade * origemFactor / destinoFactor
}

export function custoIngrediente(ingrediente: IngredienteFicha, insumos: Insumo[]) {
  const insumo = insumos.find((item) => item.nome.toLowerCase() === ingrediente.insumoNome.toLowerCase())
  if (!insumo) return 0
  return converterQuantidade(ingrediente.quantidade, ingrediente.unidade, insumo.unidadeEmbalagem || insumo.unidade) * custoPorUnidade(insumo)
}

export function calcularFicha(ficha: FichaTecnica, insumos: Insumo[]) {
  const ingredientes = ficha.ingredientes.reduce((total, ingrediente) => total + custoIngrediente(ingrediente, insumos), 0)
  const embalagens = ficha.embalagem || 0
  const cmv = ingredientes + embalagens
  const margem = Math.max(ficha.precoVenda - cmv, 0)
  return { ingredientes, embalagens, cmv, cmvPercentual: ficha.precoVenda ? cmv / ficha.precoVenda * 100 : 0, margem, margemPercentual: ficha.precoVenda ? margem / ficha.precoVenda * 100 : 0, markup: cmv ? ficha.precoVenda / cmv : 0 }
}

export function alertaCmv(percentual: number) {
  if (percentual <= 35) return { label: "Excelente", tone: "success" as const }
  if (percentual <= 40) return { label: "Atenção", tone: "warning" as const }
  if (percentual <= 45) return { label: "Alto", tone: "orange" as const }
  return { label: "Crítico", tone: "danger" as const }
}

export const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const formatPercent = (value: number) => `${value.toFixed(2).replace(".", ",")}%`
export const seedFichas: FichaTecnica[] = [
  { id: "super-bacon-bbq", nome: "Super Bacon BBQ", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Bacon em cubos", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "costeloburguer", nome: "Costeloburguer", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 5, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "donzao", nome: "Donzão", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }] },
  { id: "dom-supreme", nome: "Dom Supreme", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa", quantidade: 40, unidade: "g" }, { insumoNome: "Anel de cebola", quantidade: 40, unidade: "g" }] },
  { id: "costela-do-dom", nome: "Costela do Dom", precoVenda: 0, ingredientes: [{ insumoNome: "Gás 13kg", quantidade: 1, unidade: "un" }, { insumoNome: "Barbecue", quantidade: 100, unidade: "g" }, { insumoNome: "Alho torrado", quantidade: 40, unidade: "g" }, { insumoNome: "Pimenta Biquinho", quantidade: 20, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 15, unidade: "g" }] },
]
export function seedInsumos(base: Insumo[]) { return base }

import type { FichaTecnica, Insumo, IngredienteFicha, Item } from "./types"

const unitFactor: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1, unidade: 1, pacote: 1, caixa: 1, bobina: 1, "maço": 1, pct: 1, metro: 1, aplicação: 1 }

export function custoPorUnidade(insumo: Insumo) {
  const quantidade = Math.max(insumo.quantidadeEmbalagem || 1, 0.0001)
  const unidadeConteudo = insumo.unidadeConteudo || insumo.unidadeEmbalagem || insumo.unidade
  const fator = unitFactor[unidadeConteudo] || 1
  return insumo.precoCompra / (quantidade * fator)
}

export function converterQuantidade(quantidade: number, origem: string, destino: string) {
  const origemFactor = unitFactor[origem]
  const destinoFactor = unitFactor[destino]
  if (!origemFactor || !destinoFactor) throw new Error("UNIDADE_INCOMPATIVEL")
  return quantidade * origemFactor / destinoFactor
}

export function converterQuantidadeFichaParaEstoque({ quantidadeFicha, unidadeFicha, insumo, itemEstoque }: { quantidadeFicha: number; unidadeFicha: string; insumo: Insumo; itemEstoque: Item }) {
  const unidadeEstoque = itemEstoque.unidadeEstoque || itemEstoque.unidade
  if (!unidadeEstoque) throw new Error("UNIDADE_INCOMPATIVEL")
  if (!Number.isFinite(quantidadeFicha) || quantidadeFicha < 0 || !unidadeEstoque) throw new Error("UNIDADE_INCOMPATIVEL")
  const unidadeConteudo = insumo.unidadeConteudo || insumo.unidadeEmbalagem
  const quantidadeConteudo = insumo.quantidadeConteudo
  const embalagem = new Set(["pacote", "caixa", "bobina", "maço", "fardo", "saco", "garrafa", "lata", "pct"])
  if (embalagem.has(unidadeEstoque)) {
    if (!unidadeConteudo || !quantidadeConteudo || quantidadeConteudo <= 0) throw new Error("UNIDADE_INCOMPATIVEL")
    return { quantidadeEstoque: converterQuantidade(quantidadeFicha, unidadeFicha, unidadeConteudo) / quantidadeConteudo, unidadeEstoque }
  }
  if (unidadeEstoque === "un" || unidadeEstoque === "unidade") {
    if (unidadeFicha !== "un" && unidadeFicha !== "unidade") throw new Error("UNIDADE_INCOMPATIVEL")
    return { quantidadeEstoque: quantidadeFicha, unidadeEstoque: "un" }
  }
  return { quantidadeEstoque: converterQuantidade(quantidadeFicha, unidadeFicha, unidadeEstoque), unidadeEstoque }
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

export function calcularConsumoVenda(venda: { id: string; produtoNome: string; quantidade: number; fichaTecnicaId?: string }, ficha: FichaTecnica | undefined, insumos: Insumo[], estoque: Item[] = []) {
  if (!ficha) return { ok: false as const, motivo: "Ficha técnica não encontrada", consumos: [] as Array<{ insumo: Insumo; ingrediente: IngredienteFicha; quantidade: number; quantidadeBase: number; unidadeBase: "g" | "kg" | "ml" | "l" | "un" }> }
  if (!Number.isFinite(venda.quantidade) || venda.quantidade <= 0) return { ok: false as const, motivo: "Quantidade vendida inválida", consumos: [] as Array<{ insumo: Insumo; ingrediente: IngredienteFicha; quantidade: number; quantidadeBase: number; unidadeBase: "g" | "kg" | "ml" | "l" | "un" }> }
  const missing = ficha.ingredientes.filter((ingrediente) => !ingrediente.insumoId || !insumos.some((item) => item.id === ingrediente.insumoId)).map((ingrediente) => ingrediente.insumoNome)
  if (missing.length > 0) return { ok: false as const, codigo: "INSUMO_SEM_VINCULO", motivo: `Insumo sem vínculo válido: ${missing.join(", ")}`, consumos: [] as Array<{ insumo: Insumo; ingrediente: IngredienteFicha; quantidade: number; quantidadeBase: number; unidadeBase: string; unidadeEstoque: string }> }
  const consumos: Array<{ insumo: Insumo; ingrediente: IngredienteFicha; quantidade: number; quantidadeBase: number; unidadeBase: string; unidadeEstoque: string }> = []
  for (const ingrediente of ficha.ingredientes) {
    const insumo = insumos.find((item) => item.id === ingrediente.insumoId)!
    const itemEstoque = estoque.find((item) => item.insumoId === ingrediente.insumoId || item.id === ingrediente.insumoId)
    if (!itemEstoque) return { ok: false as const, codigo: "INSUMO_SEM_VINCULO", motivo: `Insumo sem item real no estoque: ${ingrediente.insumoNome}`, consumos: [] as typeof consumos }
    try {
      const quantidade = ingrediente.quantidade * venda.quantidade
      const convertido = converterQuantidadeFichaParaEstoque({ quantidadeFicha: quantidade, unidadeFicha: ingrediente.unidade, insumo, itemEstoque })
      consumos.push({ insumo, ingrediente, quantidade, quantidadeBase: convertido.quantidadeEstoque, unidadeBase: ingrediente.unidade, unidadeEstoque: convertido.unidadeEstoque })
    } catch {
      return { ok: false as const, codigo: "UNIDADE_INCOMPATIVEL", motivo: `Conversão incompatível para ${ingrediente.insumoNome}`, consumos: [] as typeof consumos }
    }
  }
  return { ok: true as const, consumos }
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
  { id: "super-bacon-bbq", nome: "Super Bacon BBQ", categoria: "Hambúrguer Artesanal", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoId: "carne-hamburguer-kg", insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Bacon fatiado", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado metalizado", quantidade: 1, unidade: "un" }] },
  { id: "costeloburguer", nome: "Costeloburguer", categoria: "Hambúrguer Artesanal", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoId: "carne-hamburguer-kg", insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream Cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 5, unidade: "g" }, { insumoNome: "Onion Rings", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado metalizado", quantidade: 1, unidade: "un" }] },
  { id: "donzao", nome: "Donzão", categoria: "Hambúrguer Artesanal", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoId: "carne-hamburguer-kg", insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Mussarela", quantidade: 25, unidade: "g" }, { insumoNome: "Cream Cheese", quantidade: 30, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 40, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 5, unidade: "g" }, { insumoNome: "Onion Rings", quantidade: 40, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 20, unidade: "g" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado metalizado", quantidade: 1, unidade: "un" }] },
  { id: "dom-supreme", nome: "Dom Supreme", categoria: "Hambúrguer Artesanal", precoVenda: 0, ingredientes: [{ insumoNome: "Pão Australiano Aussie", quantidade: 1, unidade: "un" }, { insumoId: "carne-hamburguer-kg", insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 40, unidade: "g" }, { insumoNome: "Onion Rings", quantidade: 40, unidade: "g" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado metalizado", quantidade: 1, unidade: "un" }] },
  { id: "dom-cheddar", nome: "Dom Cheddar", categoria: "Hambúrguer Artesanal", precoVenda: 0, ingredientes: [{ insumoNome: "Pão brioche 4CT", quantidade: 1, unidade: "un" }, { insumoId: "carne-hamburguer-kg", insumoNome: "Carne de hambúrguer", quantidade: 180, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 30, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 40, unidade: "g" }, { insumoNome: "Onion Rings", quantidade: 40, unidade: "g" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }, { insumoNome: "Papel acoplado metalizado", quantidade: 1, unidade: "un" }] },
  { id: "batata-dom-costelo", nome: "Batata Dom Costelo", categoria: "Batatas", precoVenda: 0, ingredientes: [{ insumoNome: "Batata", quantidade: 400, unidade: "g" }, { insumoNome: "Cream Cheese", quantidade: 100, unidade: "g" }, { insumoNome: "Costela Desfiada", quantidade: 80, unidade: "g" }, { insumoNome: "Barbecue", quantidade: 50, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 10, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
  { id: "batata-cheddar-bacon", nome: "Batata Cheddar e Bacon", categoria: "Batatas", precoVenda: 0, ingredientes: [{ insumoNome: "Batata", quantidade: 400, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 100, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 80, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
  { id: "batata-supreme", nome: "Batata Supreme", categoria: "Batatas", precoVenda: 0, ingredientes: [{ insumoNome: "Batata", quantidade: 400, unidade: "g" }, { insumoNome: "Cheddar Polenghi profissional", quantidade: 100, unidade: "g" }, { insumoNome: "Farofa de bacon", quantidade: 80, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
  { id: "costela-do-dom", nome: "Costela do Dom", categoria: "Costelas", precoVenda: 0, ingredientes: [{ insumoNome: "Costela suína", quantidade: 1, unidade: "kg" }, { insumoNome: "Tempero do Dom", quantidade: 1, unidade: "aplicação" }, { insumoNome: "Barbecue", quantidade: 100, unidade: "g" }, { insumoNome: "Alho torrado", quantidade: 40, unidade: "g" }, { insumoNome: "Pimenta Biquinho", quantidade: 20, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 15, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
  { id: "costela-de-queijo", nome: "Costela de Queijo", categoria: "Costelas", precoVenda: 0, ingredientes: [{ insumoNome: "Costela suína", quantidade: 1, unidade: "kg" }, { insumoNome: "Tempero do Dom", quantidade: 1, unidade: "aplicação" }, { insumoNome: "Barbecue", quantidade: 100, unidade: "g" }, { insumoNome: "Cream Cheese", quantidade: 100, unidade: "g" }, { insumoNome: "Mussarela", quantidade: 200, unidade: "g" }, { insumoNome: "Alho torrado", quantidade: 40, unidade: "g" }, { insumoNome: "Pimenta Biquinho", quantidade: 20, unidade: "g" }, { insumoNome: "Cebolinha", quantidade: 15, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
  { id: "costela-bovina-pedra", nome: "Costela Bovina na Pedra", categoria: "Costelas", precoVenda: 0, ingredientes: [{ insumoNome: "Costela bovina", quantidade: 1, unidade: "kg" }, { insumoNome: "Sal de parrilla", quantidade: 20, unidade: "g" }, { insumoNome: "Alho torrado", quantidade: 40, unidade: "g" }, { insumoNome: "Batata", quantidade: 400, unidade: "g" }, { insumoNome: "Arroz", quantidade: 300, unidade: "g" }, { insumoNome: "Farofa", quantidade: 50, unidade: "g" }, { insumoNome: "Embalagem H7", quantidade: 1, unidade: "un" }, { insumoNome: "Saco Kraft G", quantidade: 1, unidade: "un" }] },
]
export function normalizarNomeInsumo(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ")
}

export function resolverIngredientesFicha(ficha: FichaTecnica, insumos: Insumo[]) {
  const ingredientes = [] as IngredienteFicha[]
  for (const ingrediente of ficha.ingredientes) {
    const porId = ingrediente.insumoId ? insumos.find((item) => item.id === ingrediente.insumoId) : undefined
    const nome = normalizarNomeInsumo(ingrediente.insumoNome)
    const candidatos = porId ? [porId] : insumos.filter((item) => normalizarNomeInsumo(item.nome) === nome || item.aliases?.some((alias) => normalizarNomeInsumo(alias) === nome))
    const unicos = [...new Map(candidatos.filter(Boolean).map((item) => [item.id, item])).values()]
    if (unicos.length !== 1) return { ok: false as const, codigo: "FICHA_COM_INGREDIENTE_SEM_VINCULO", ingrediente: ingrediente.insumoNome, ficha: ficha.nome }
    ingredientes.push({ ...ingrediente, insumoId: unicos[0].id, insumoNome: unicos[0].nome })
  }
  return { ok: true as const, ficha: { ...ficha, ingredientes } }
}

export function migrarFichasParaCarneKg(fichas: FichaTecnica[], insumos: Insumo[]) {
  const carne = insumos.find((item) => item.id === "carne-hamburguer-kg" || item.nome === "Carne de hambúrguer")
  if (!carne) return fichas
  return fichas.map((ficha) => ({ ...ficha, ingredientes: ficha.ingredientes.map((ingrediente) => {
    const nome = ingrediente.insumoNome.trim().toLowerCase()
    const legado = nome === "carne de hambúrguer / blend 180g" || nome === "blend 180g" || nome === "blend bovino 180g"
    return legado ? { ...ingrediente, insumoId: carne.id, insumoNome: carne.nome, quantidade: 180, unidade: "g" as const } : ingrediente
  }) }))
}

export function seedInsumos(base: Insumo[]) { return base }

"use client"

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  onSnapshot,
  runTransaction,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Item, HistoricoEntry, Receita, UsuarioSistema, Insumo, FichaTecnica, VendaProduto, CompraRegistro, FinanceConfig, VendaFinanceira, DespesaFinanceira, MovimentacaoEstoque, Combo } from "./types"
import type { FinanceAuditSnapshot } from "./finance-engine"
import { resolverIngredientesFicha, normalizarNomeInsumo } from "./cmv-engine"

// Collections - dados globais compartilhados
const USUARIOS_COLLECTION = "usuarios"
const GLOBAL_DATA_DOC = "global/data"

// ========== USUARIOS (GLOBAL) ==========

export async function createUsuarioProfile(
  userId: string,
  data: Omit<UsuarioSistema, "login">
) {
  try {
    const safeRole = data.role === "owner" || data.role === "admin" || data.role === "analista" || data.role === "operador" ? data.role : "operador"
    await setDoc(doc(db, USUARIOS_COLLECTION, userId), {
      ...data,
      uid: userId,
      role: safeRole,
      login: data.email || userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getUsuarioProfileByEmail(email: string) {
  try {
    const snapshot = await getDocs(collection(db, USUARIOS_COLLECTION))
    const normalized = email.trim().toLowerCase()
    const match = snapshot.docs.find((item) => String(item.data().email || "").trim().toLowerCase() === normalized)
    return match ? { data: { login: match.id, ...match.data() } as UsuarioSistema, error: null } : { data: null, error: "Usuário não encontrado" }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getUsuarioProfile(userId: string) {
  try {
    const docRef = doc(db, USUARIOS_COLLECTION, userId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: { login: docSnap.id, ...docSnap.data() } as UsuarioSistema, error: null }
    }
    return { data: null, error: "Usuário não encontrado" }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateUsuarioProfile(
  userId: string,
  data: Partial<UsuarioSistema>
) {
  try {
    await updateDoc(doc(db, USUARIOS_COLLECTION, userId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getAllUsuarios() {
  try {
    const querySnapshot = await getDocs(collection(db, USUARIOS_COLLECTION))
    const usuarios: UsuarioSistema[] = []
    querySnapshot.forEach((docSnap) => {
      usuarios.push({ login: docSnap.id, ...docSnap.data() } as UsuarioSistema)
    })
    return { data: usuarios, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function deleteUsuario(userId: string) {
  try {
    await deleteDoc(doc(db, USUARIOS_COLLECTION, userId))
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function saveUsuariosFirebase(usuarios: UsuarioSistema[]) {
  try {
    // Salvar cada usuário individualmente no Firebase
    for (const user of usuarios) {
      const { login, ...userData } = user
      await setDoc(doc(db, USUARIOS_COLLECTION, login), {
        ...userData,
        updatedAt: Timestamp.now(),
      })
    }
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Listener em tempo real para usuários
export function subscribeToUsuarios(callback: (usuarios: UsuarioSistema[]) => void) {
  return onSnapshot(
    collection(db, USUARIOS_COLLECTION), 
    (snapshot) => {
      const usuarios: UsuarioSistema[] = []
      snapshot.forEach((docSnap) => {
        usuarios.push({ login: docSnap.id, ...docSnap.data() } as UsuarioSistema)
      })
      callback(usuarios)
    },
    (error) => {
      console.error("[Firebase] Erro no listener de usuários:", error.message)
    }
  )
}

// ========== ESTOQUE (GLOBAL) ==========

export async function saveEstoque(userId: string, itens: Item[]) {
  try {
    // Salvar no documento global para todos terem acesso
    await setDoc(doc(db, "estoque", "global"), {
      itens,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getEstoque(userId: string) {
  try {
    // Buscar do documento global
    const docRef = doc(db, "estoque", "global")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().itens as Item[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Listener em tempo real para estoque
export function subscribeToEstoque(callback: (itens: Item[]) => void) {
  return onSnapshot(
    doc(db, "estoque", "global"), 
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().itens as Item[])
      }
    },
    (error) => {
      console.error("[Firebase] Erro no listener de estoque:", error.message)
    }
  )
}

// ========== HISTORICO (GLOBAL) ==========

export async function saveHistorico(userId: string, historico: HistoricoEntry[]) {
  try {
    await setDoc(doc(db, "historico", "global"), {
      entries: historico,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getHistorico(userId: string) {
  try {
    const docRef = doc(db, "historico", "global")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().entries as HistoricoEntry[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Listener em tempo real para histórico
export function subscribeToHistorico(callback: (historico: HistoricoEntry[]) => void) {
  return onSnapshot(
    doc(db, "historico", "global"), 
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().entries as HistoricoEntry[])
      }
    },
    (error) => {
      console.error("[Firebase] Erro no listener de histórico:", error.message)
    }
  )
}

// ========== RECEITAS (GLOBAL) ==========

export async function saveReceitas(userId: string, receitas: Receita[]) {
  try {
    await setDoc(doc(db, "receitas", "global"), {
      receitas,
      updatedAt: Timestamp.now(),
      lastModifiedBy: userId,
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getReceitas(userId: string) {
  try {
    const docRef = doc(db, "receitas", "global")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().receitas as Receita[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Listener em tempo real para receitas
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export async function upsertCollectionData<T extends { id?: string }>(collectionName: string, data: T[]) {
  for (const item of data) {
    const id = item.id || crypto.randomUUID()
    await setDoc(doc(db, collectionName, id), { ...item, id, updatedAt: Timestamp.now() })
  }
}

export async function saveComprasData<T>(collectionName: string, data: T[]) {
  await setDoc(doc(db, "compras", collectionName), { data, updatedAt: Timestamp.now() })
}

export async function getComprasData<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDoc(doc(db, "compras", collectionName))
  return snapshot.exists() ? (snapshot.data().data as T[]) : []
}

export async function getInsumos() { return getComprasData<Insumo>("insumos") }
export async function saveInsumos(data: Insumo[]) { return saveComprasData("insumos", data) }
export async function getFichasTecnicas() { return getComprasData<FichaTecnica>("fichas-tecnicas") }
export async function saveFichasTecnicas(data: FichaTecnica[]) { return saveComprasData("fichas-tecnicas", data) }
export async function getCombos() { return getComprasData<Combo>("combos") }
export async function saveCombos(data: Combo[]) { return saveComprasData("combos", data) }

export async function migrarCombosV1(seed: Combo[]) {
  const settingsRef = doc(db, "settings", "system")
  const settingsSnap = await getDoc(settingsRef)
  const existing = await getCombos()
  const versaoAtual = settingsSnap.data()?.combosDomCosteloV2Aplicada === true
  if (versaoAtual) return { applied: false, skipped: true, data: existing.length ? existing : seed }
  const idsLegados = new Set(["combo-casal", "combo-familia"])
  const porId = new Map(existing.filter((combo) => !idsLegados.has(combo.id)).map((combo) => [combo.id, combo]))
  for (const combo of seed) porId.set(combo.id, combo)
  const data = [...porId.values()]
  await saveCombos(data)
  await setDoc(settingsRef, { combosDomCosteloV2Aplicada: true, combosDomCosteloV2AplicadaEm: Timestamp.now(), combosDomCosteloV2Count: seed.length }, { merge: true })
  return { applied: true, skipped: false, data }
}

export async function getFinanceConfig() { const rows = await getComprasData<FinanceConfig>("finance-config"); return rows[0] }
export async function saveFinanceConfig(data: FinanceConfig) { return saveComprasData("finance-config", [data]) }
export async function getVendasFinanceiras() { return getComprasData<VendaFinanceira>("finance-vendas") }
export async function saveVendasFinanceiras(data: VendaFinanceira[]) { return saveComprasData("finance-vendas", data) }
export async function getDespesasFinanceiras() { return getComprasData<DespesaFinanceira>("finance-despesas") }
export async function saveDespesasFinanceiras(data: DespesaFinanceira[]) { return saveComprasData("finance-despesas", data) }
export async function getFinanceAuditSnapshots() { return getComprasData<FinanceAuditSnapshot>("finance-auditoria") }
export async function saveFinanceAuditSnapshot(data: FinanceAuditSnapshot) { const existentes = await getFinanceAuditSnapshots(); return saveComprasData("finance-auditoria", [...existentes.filter(item => item.competencia !== data.competencia), data]) }

export async function initializeFichasTecnicas(seed: FichaTecnica[], seedVersion = 1) {
  const existing = await getFichasTecnicas()
  if (existing.length > 0) return { data: existing, seeded: false }
  await saveFichasTecnicas(seed)
  await setDoc(doc(db, "settings", "system"), { seedVersion, updatedAt: Timestamp.now() }, { merge: true })
  return { data: seed, seeded: true }
}

export async function migrarCustosMestresDomCosteloV1(master: Insumo[]) {
  const settingsRef = doc(db, "settings", "system")
  const settingsSnap = await getDoc(settingsRef)
  if (settingsSnap.data()?.custosMestresDomCosteloV1Aplicados === true) return { applied: false, skipped: true, data: await getInsumos(), updated: 0 }
  const existing = await getInsumos()
  const byId = new Map(existing.map((item) => [item.id, item]))
  const normalizar = (value: string) => value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, " ")
  let updated = 0
  for (const mestre of master) {
    const aliases = mestre.aliases ?? []
    const atual = byId.get(mestre.id) ?? [...byId.values()].find((item) => normalizar(item.nome) === normalizar(mestre.nome) || aliases.some((alias) => normalizar(alias) === normalizar(item.nome)))
    if (atual) {
      byId.set(atual.id, { ...atual, ...mestre, id: atual.id, atual: atual.atual, min: atual.min, categoria: atual.categoria ?? mestre.categoria })
      updated += 1
    } else {
      byId.set(mestre.id, { ...mestre, atual: mestre.atual ?? 0 })
      updated += 1
    }
  }
  const data = [...byId.values()]
  await saveInsumos(data)
  await setDoc(settingsRef, { custosMestresDomCosteloV1Aplicados: true, custosMestresDomCosteloV1AplicadosEm: Timestamp.now(), custosMestresDomCosteloV1Count: updated }, { merge: true })
  return { applied: true, skipped: false, data, updated }
}

export async function migrarFichasTecnicasV2(seed: FichaTecnica[], insumos: Insumo[], aliases: Record<string, string[]> = {}) {
  const settingsRef = doc(db, "settings", "system")
  const settingsSnap = await getDoc(settingsRef)
  if (settingsSnap.data()?.fichasTecnicasDomCosteloV2Aplicada === true) {
    const existing = await getFichasTecnicas()
    const migrated = existing.map((ficha) => {
      const seedFicha = seed.find((item) => item.id === ficha.id || normalizarNomeInsumo(item.nome) === normalizarNomeInsumo(ficha.nome))
      return ficha.precoVenda > 0 || !seedFicha ? ficha : { ...ficha, precoVenda: seedFicha.precoVenda }
    })
    if (migrated.some((ficha, index) => ficha.precoVenda !== existing[index]?.precoVenda)) await saveFichasTecnicas(migrated)
    return { applied: false, skipped: true, data: migrated, errors: [] as string[] }
  }
  const existing = await getFichasTecnicas()
  const errors: string[] = []
  const desired = seed.map((ficha) => ({ ...ficha, ingredientes: ficha.ingredientes.map((ingrediente) => ({ ...ingrediente, insumoId: ingrediente.insumoId, insumoNome: ingrediente.insumoNome })) }))
  const resolved: FichaTecnica[] = []
  for (const ficha of desired) {
    const resultado = resolverIngredientesFicha(ficha, insumos.map((item) => ({ ...item, aliases: [...(item.aliases ?? []), ...(aliases[item.id ?? ""] ?? []), ...(aliases[item.nome] ?? [])] })))
    if (!resultado.ok) { errors.push(`${resultado.codigo}:${resultado.ficha}:${resultado.ingrediente}`); continue }
    const atual = existing.find((item) => item.id === ficha.id) ?? existing.find((item) => normalizarNomeInsumo(item.nome) === normalizarNomeInsumo(ficha.nome))
    resolved.push({ ...resultado.ficha, precoVenda: atual?.precoVenda && atual.precoVenda > 0 ? atual.precoVenda : ficha.precoVenda, id: atual?.id ?? ficha.id })
  }
  if (errors.length > 0) return { applied: false, skipped: false, data: existing, errors }
  const porId = new Map(existing.map((item) => [item.id, item]))
  for (const ficha of resolved) porId.set(ficha.id, ficha)
  const data = [...porId.values()]
  await saveFichasTecnicas(data)
  await setDoc(settingsRef, { fichasTecnicasDomCosteloV2Aplicada: true, fichasTecnicasDomCosteloV2AplicadaEm: Timestamp.now(), fichasTecnicasDomCosteloV2Count: resolved.length }, { merge: true })
  return { applied: true, skipped: false, data, errors: [] as string[] }
}
export async function getVendasProdutos() { return getComprasData<VendaProduto>("vendas") }
export async function saveVendasProdutos(data: VendaProduto[]) { return saveComprasData("vendas", data) }
export async function getComprasHistorico() { return getComprasData<CompraRegistro>("historico") }
export async function saveComprasHistorico(data: CompraRegistro[]) { return saveComprasData("historico", data) }
const MOVIMENTACOES_COLLECTION = "movimentacoesEstoque"

export async function getMovimentacoesEstoque() {
  const snapshot = await getDocs(collection(db, MOVIMENTACOES_COLLECTION))
  const novas = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as MovimentacaoEstoque)
  const legado = await getComprasData<MovimentacaoEstoque>("movimentacoes-estoque")
  return [...novas, ...legado.filter((item) => !novas.some((novo) => novo.id === item.id))]
}

export async function saveMovimentacoesEstoque(data: MovimentacaoEstoque[]) {
  for (const item of data) {
    const id = item.id || crypto.randomUUID()
    await setDoc(doc(db, MOVIMENTACOES_COLLECTION, id), { ...item, id })
  }
}

export async function registrarBaixaBloqueada(params: { venda: VendaFinanceira; codigo: string; mensagem: string; userId: string }) {
  const baixaRef = doc(db, "baixasVendas", params.venda.id)
  const vendaRef = doc(db, "compras", "finance-vendas")
  await setDoc(baixaRef, { vendaId: params.venda.id, produtoId: params.venda.produtoId, produtoNomeSnapshot: params.venda.produtoNome, quantidadeVendida: params.venda.quantidade, data: params.venda.data, codigo: params.codigo, motivo: params.mensagem, detalhes: params.mensagem, status: "bloqueada", atualizadoEm: Timestamp.now(), atualizadoPorUid: params.userId }, { merge: true })
  const vendaSnap = await getDoc(vendaRef)
  if (vendaSnap.exists()) {
    const vendas = (vendaSnap.data().data ?? []) as VendaFinanceira[]
    await setDoc(vendaRef, { data: vendas.map((venda) => venda.id === params.venda.id ? { ...venda, statusBaixa: "bloqueada", estoqueStatus: "bloqueada", motivoBloqueio: `${params.codigo}: ${params.mensagem}` } : venda), updatedAt: Timestamp.now() }, { merge: true })
  }
}

export async function registrarBaixaVendaAtomica(params: { venda: VendaFinanceira; consumos: Array<{ insumoId?: string; insumoNomeSnapshot: string; quantidadeBase: number; unidadeBase: string; quantidadeFicha?: number; unidadeFicha?: string }>; userId: string; agora: string; canalVenda?: string }) {
  const estoqueRef = doc(db, "estoque", "global")
  const vendaRef = doc(db, "compras", "finance-vendas")
  const baixaRef = doc(db, "baixasVendas", params.venda.id)
  return runTransaction(db, async (transaction) => {
    const estoqueSnap = await transaction.get(estoqueRef)
    const vendaSnap = await transaction.get(vendaRef)
    const baixaSnap = await transaction.get(baixaRef)
    if (baixaSnap.exists()) return { idempotente: true, itens: (estoqueSnap.data()?.itens ?? []) as Item[] }
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const atualizados = [...itens]
    const baixaId = crypto.randomUUID()
    const verificacoes = params.consumos.map((consumo) => {
      const index = atualizados.findIndex((item) => (consumo.insumoId && item.insumoId === consumo.insumoId) || item.nome === consumo.insumoNomeSnapshot)
      if (index < 0) throw new Error(`Insumo não encontrado no estoque: ${consumo.insumoNomeSnapshot}`)
      if (atualizados[index].atual < consumo.quantidadeBase) throw new Error(`Estoque insuficiente: ${consumo.insumoNomeSnapshot}. Necessário: ${consumo.quantidadeBase} ${consumo.unidadeBase}. Disponível: ${atualizados[index].atual} ${atualizados[index].unidadeEstoque ?? atualizados[index].unidade ?? consumo.unidadeBase}.`)
      return { consumo, index }
    })
    for (const { consumo, index } of verificacoes) {
      const index = atualizados.findIndex((item) => (consumo.insumoId && item.insumoId === consumo.insumoId) || item.nome === consumo.insumoNomeSnapshot)
      if (index < 0) throw new Error(`Insumo não encontrado no estoque: ${consumo.insumoNomeSnapshot}`)
      if (atualizados[index].atual < consumo.quantidadeBase) throw new Error(`Estoque insuficiente: ${consumo.insumoNomeSnapshot}`)
      atualizados[index] = { ...atualizados[index], atual: atualizados[index].atual - consumo.quantidadeBase }
      const movimentoRef = doc(collection(db, MOVIMENTACOES_COLLECTION))
      transaction.set(movimentoRef, { id: movimentoRef.id, tipo: "saida_venda", insumoId: atualizados[index].insumoId ?? movimentoRef.id, insumoNomeSnapshot: consumo.insumoNomeSnapshot, quantidade: -consumo.quantidadeBase, quantidadeBase: -consumo.quantidadeBase, unidadeSnapshot: consumo.unidadeBase, unidadeBase: consumo.unidadeBase, unidadeEstoque: consumo.unidadeBase, quantidadeFicha: consumo.quantidadeFicha, unidadeFicha: consumo.unidadeFicha, quantidadeBaixadaEstoque: consumo.quantidadeBase, saldoAnterior: atualizados[index].atual + consumo.quantidadeBase, saldoPosterior: atualizados[index].atual, estoqueAnterior: atualizados[index].atual + consumo.quantidadeBase, estoquePosterior: atualizados[index].atual, valorTotal: 0, precoUnitarioSnapshot: 0, origem: "venda_automatica", status: "efetivada", vendaId: params.venda.id, produtoId: params.venda.produtoId, produtoNomeSnapshot: params.venda.produtoNome, quantidadeVendida: params.venda.quantidade, canalVenda: params.canalVenda ?? params.venda.canalNaVenda, baixaId: baixaId, criadoPorUid: params.userId, dataMovimentacao: params.agora, criadoEm: params.agora })
    }
    transaction.set(estoqueRef, { itens: atualizados, updatedAt: Timestamp.now(), lastModifiedBy: params.userId })
    transaction.set(baixaRef, { id: baixaId, vendaId: params.venda.id, consumos: params.consumos, criadoPorUid: params.userId, criadoEm: params.agora })
    if (vendaSnap.exists()) {
      const vendas = (vendaSnap.data().data ?? []) as VendaFinanceira[]
      transaction.update(vendaRef, { data: vendas.map((venda) => venda.id === params.venda.id ? { ...venda, statusBaixa: "baixada", baixaId } : venda), updatedAt: Timestamp.now() })
    }
    return { idempotente: false, itens: atualizados, baixaId }
  }).catch(async (error) => {
    const motivo = error instanceof Error && error.message.startsWith("Estoque insuficiente") ? "ESTOQUE_INSUFICIENTE" : error instanceof Error && error.message.startsWith("Insumo não encontrado") ? "INSUMO_SEM_VINCULO" : error instanceof Error && error.message.includes("UNIDADE_INCOMPATIVEL") ? "UNIDADE_INCOMPATIVEL" : "ERRO_PROCESSAMENTO"
    await setDoc(baixaRef, { vendaId: params.venda.id, produtoId: params.venda.produtoId, produtoNomeSnapshot: params.venda.produtoNome, data: params.venda.data, motivo, detalhes: error instanceof Error ? error.message : "Erro desconhecido", status: "bloqueada", consumos: params.consumos, atualizadoEm: Timestamp.now(), atualizadoPorUid: params.userId }, { merge: true })
    const vendaSnap = await getDoc(vendaRef)
    if (vendaSnap.exists()) {
      const vendas = (vendaSnap.data().data ?? []) as VendaFinanceira[]
      await setDoc(vendaRef, { data: vendas.map((venda) => venda.id === params.venda.id ? { ...venda, statusBaixa: "bloqueada", estoqueStatus: "bloqueada", motivoBloqueio: error instanceof Error ? error.message : "Erro desconhecido" } : venda), updatedAt: Timestamp.now() }, { merge: true })
    }
    throw error
  })
}

export async function registrarEntradaAtomica(params: { movimento: MovimentacaoEstoque; itemNome: string; userId: string }) {
  const movimentoRef = doc(db, MOVIMENTACOES_COLLECTION, params.movimento.id)
  const estoqueRef = doc(db, "estoque", "global")
  return runTransaction(db, async (transaction) => {
    const estoqueSnap = await transaction.get(estoqueRef)
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const index = itens.findIndex((item) => item.nome === params.itemNome || item.insumoId === params.movimento.insumoId)
    if (index < 0) throw new Error("Insumo não encontrado no estoque")
    const item = itens[index]
    const quantidade = params.movimento.quantidade
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw new Error("A quantidade deve ser maior que zero")
    const atualizados = itens.map((row, rowIndex) => rowIndex === index ? { ...row, atual: row.atual + quantidade } : row)
    transaction.set(estoqueRef, { itens: atualizados, updatedAt: Timestamp.now(), lastModifiedBy: params.userId })
    transaction.set(movimentoRef, params.movimento)
    return atualizados
  })
}

export async function registrarSaidaAtomica(params: { movimento: MovimentacaoEstoque; itemNome: string; userId: string }) {
  const movimentoRef = doc(db, MOVIMENTACOES_COLLECTION, params.movimento.id)
  const estoqueRef = doc(db, "estoque", "global")
  return runTransaction(db, async (transaction) => {
    const estoqueSnap = await transaction.get(estoqueRef)
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const index = itens.findIndex((item) => item.nome === params.itemNome || item.insumoId === params.movimento.insumoId)
    if (index < 0) throw new Error("Insumo não encontrado no estoque")
    const item = itens[index]
    const quantidade = Math.abs(params.movimento.quantidade)
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw new Error("A quantidade deve ser maior que zero")
    if (item.atual < quantidade) throw new Error("Estoque insuficiente para esta saída")
    const atualizados = itens.map((row, rowIndex) => rowIndex === index ? { ...row, atual: row.atual - quantidade } : row)
    transaction.set(estoqueRef, { itens: atualizados, updatedAt: Timestamp.now(), lastModifiedBy: params.userId })
    transaction.set(movimentoRef, { ...params.movimento, quantidade: -quantidade, quantidadeBase: -Math.abs(params.movimento.quantidadeBase) })
    return atualizados
  })
}

export async function ajustarInventarioAtomico(params: { itemNome: string; insumoId?: string; estoqueBaseDaContagem: number; estoqueContado: number; movimento: MovimentacaoEstoque; userId: string }) {
  const movimentoRef = doc(db, MOVIMENTACOES_COLLECTION, params.movimento.id)
  const estoqueRef = doc(db, "estoque", "global")
  return runTransaction(db, async (transaction) => {
    const estoqueSnap = await transaction.get(estoqueRef)
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const index = itens.findIndex((item) => item.nome === params.itemNome && (!params.insumoId || item.insumoId === params.insumoId))
    if (index < 0) throw new Error("Item não encontrado no estoque")
    const item = itens[index]
    if (item.atual !== params.estoqueBaseDaContagem) throw new Error("CONCORRENCIA_INVENTARIO")
    if (!Number.isFinite(params.estoqueContado) || params.estoqueContado < 0) throw new Error("Quantidade contada inválida")
    const diferenca = params.estoqueContado - item.atual
    if (diferenca === 0) return itens
    const atualizados = itens.map((row, rowIndex) => rowIndex === index ? { ...row, atual: params.estoqueContado } : row)
    transaction.set(estoqueRef, { itens: atualizados, updatedAt: Timestamp.now(), lastModifiedBy: params.userId })
    transaction.set(movimentoRef, { ...params.movimento, estoqueAnterior: item.atual, estoqueContado: params.estoqueContado, diferenca, quantidade: diferenca, quantidadeBase: diferenca })
    return atualizados
  })
}

export async function ajustarEstoqueAtomico(params: { itemNome: string; quantidadeAtual: number; movimento: MovimentacaoEstoque; userId: string }) {
  const movimentoRef = doc(db, MOVIMENTACOES_COLLECTION, params.movimento.id)
  const estoqueRef = doc(db, "estoque", "global")
  return runTransaction(db, async (transaction) => {
    const estoqueSnap = await transaction.get(estoqueRef)
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const index = itens.findIndex((item) => item.nome === params.itemNome)
    if (index < 0) throw new Error("Item não encontrado no estoque")
    if (!Number.isFinite(params.quantidadeAtual) || params.quantidadeAtual < 0) throw new Error("Quantidade inválida")
    const atualizados = itens.map((row, rowIndex) => rowIndex === index ? { ...row, atual: params.quantidadeAtual } : row)
    transaction.set(estoqueRef, { itens: atualizados, updatedAt: Timestamp.now(), lastModifiedBy: params.userId })
    transaction.set(movimentoRef, params.movimento)
    return atualizados
  })
}

export async function estornarMovimentacaoAtomica(params: { movimentoId: string; usuario: { uid: string; email?: string; nome?: string } }) {
  const movimentoRef = doc(db, MOVIMENTACOES_COLLECTION, params.movimentoId)
  const estoqueRef = doc(db, "estoque", "global")
  return runTransaction(db, async (transaction) => {
    const movimentoSnap = await transaction.get(movimentoRef)
    const estoqueSnap = await transaction.get(estoqueRef)
    if (!movimentoSnap.exists()) throw new Error("Movimentação não encontrada")
    const original = { id: movimentoSnap.id, ...movimentoSnap.data() } as MovimentacaoEstoque
    if (original.tipo !== "entrada" || original.status === "estornada") throw new Error("Esta entrada já foi estornada.")
    const itens = (estoqueSnap.exists() ? estoqueSnap.data().itens : []) as Item[]
    const index = itens.findIndex((item) => item.insumoId === original.insumoId || item.nome === original.insumoNomeSnapshot)
    if (index < 0 || itens[index].atual < original.quantidade) throw new Error("Não é possível estornar esta entrada porque o estoque atual é insuficiente.")
    const agora = new Date().toISOString()
    const inversa: MovimentacaoEstoque = { ...original, id: crypto.randomUUID(), tipo: "estorno_entrada", quantidade: -Math.abs(original.quantidade), quantidadeBase: -Math.abs(original.quantidadeBase), valorTotal: -Math.abs(original.valorTotal), precoTotal: -Math.abs(original.precoTotal ?? original.valorTotal), movimentacaoOrigemId: original.id, movimentacaoOriginalId: original.id, unidade: original.unidadeSnapshot, status: "ativa", usuarioId: params.usuario.uid, insumoNomeSnapshot: original.insumoNomeSnapshot, dataMovimentacao: agora, usuarioEmail: params.usuario.email ?? "", criadoPorUid: params.usuario.uid, criadoPorEmail: params.usuario.email, criadoPorNome: params.usuario.nome, criadoEm: agora }
    transaction.update(movimentoRef, { status: "estornada", estornadoEm: agora, estornadoPor: params.usuario.uid, estornadaPorUid: params.usuario.uid })
    transaction.update(estoqueRef, { itens: itens.map((item, itemIndex) => itemIndex === index ? { ...item, atual: item.atual - original.quantidade } : item), updatedAt: Timestamp.now(), lastModifiedBy: params.usuario.uid })
    transaction.set(doc(db, MOVIMENTACOES_COLLECTION, inversa.id), inversa)
    return inversa
  })
}

export function subscribeToReceitas(callback: (receitas: Receita[]) => void) {
  return onSnapshot(
    doc(db, "receitas", "global"), 
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().receitas as Receita[])
      }
    },
    (error) => {
      console.error("[Firebase] Erro no listener de receitas:", error.message)
    }
  )
}

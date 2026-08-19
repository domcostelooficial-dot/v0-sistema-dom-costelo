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
} from "firebase/firestore"
import { db } from "./firebase"
import type { Item, HistoricoEntry, Receita, UsuarioSistema, Insumo, FichaTecnica, VendaProduto, CompraRegistro, FinanceConfig, VendaFinanceira, DespesaFinanceira, MovimentacaoEstoque } from "./types"
import type { FinanceAuditSnapshot } from "./finance-engine"

// Collections - dados globais compartilhados
const USUARIOS_COLLECTION = "usuarios"
const GLOBAL_DATA_DOC = "global/data"

// ========== USUARIOS (GLOBAL) ==========

export async function createUsuarioProfile(
  userId: string,
  data: Omit<UsuarioSistema, "login">
) {
  try {
    const safeRole = data.role === "owner" || data.role === "admin" ? "operador" : data.role
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
export async function getVendasProdutos() { return getComprasData<VendaProduto>("vendas") }
export async function saveVendasProdutos(data: VendaProduto[]) { return saveComprasData("vendas", data) }
export async function getComprasHistorico() { return getComprasData<CompraRegistro>("historico") }
export async function saveComprasHistorico(data: CompraRegistro[]) { return saveComprasData("historico", data) }
export async function getMovimentacoesEstoque() { return getComprasData<MovimentacaoEstoque>("movimentacoes-estoque") }
export async function saveMovimentacoesEstoque(data: MovimentacaoEstoque[]) { return saveComprasData("movimentacoes-estoque", data) }

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

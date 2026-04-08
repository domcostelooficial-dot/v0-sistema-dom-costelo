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
} from "firebase/firestore"
import { db } from "./firebase"
import type { Item, HistoricoEntry, Receita, UsuarioSistema } from "./types"

// Collections
const USUARIOS_COLLECTION = "usuarios"
const ESTOQUE_COLLECTION = "estoque"
const HISTORICO_COLLECTION = "historico"
const RECEITAS_COLLECTION = "receitas"

// Helper to get user-specific document path
function getUserDocPath(userId: string, collection: string) {
  return `users/${userId}/${collection}`
}

// ========== USUARIOS ==========

export async function createUsuarioProfile(
  userId: string,
  data: Omit<UsuarioSistema, "login">
) {
  try {
    await setDoc(doc(db, USUARIOS_COLLECTION, userId), {
      ...data,
      createdAt: Timestamp.now(),
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
      return { data: docSnap.data() as UsuarioSistema, error: null }
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
    querySnapshot.forEach((doc) => {
      usuarios.push({ login: doc.id, ...doc.data() } as UsuarioSistema)
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

// ========== ESTOQUE ==========

export async function saveEstoque(userId: string, itens: Item[]) {
  try {
    await setDoc(doc(db, `users/${userId}`, "estoque"), {
      itens,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getEstoque(userId: string) {
  try {
    const docRef = doc(db, `users/${userId}`, "estoque")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().itens as Item[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ========== HISTORICO ==========

export async function saveHistorico(userId: string, historico: HistoricoEntry[]) {
  try {
    await setDoc(doc(db, `users/${userId}`, "historico"), {
      entries: historico,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getHistorico(userId: string) {
  try {
    const docRef = doc(db, `users/${userId}`, "historico")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().entries as HistoricoEntry[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// ========== RECEITAS ==========

export async function saveReceitas(userId: string, receitas: Receita[]) {
  try {
    await setDoc(doc(db, `users/${userId}`, "receitas"), {
      receitas,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function getReceitas(userId: string) {
  try {
    const docRef = doc(db, `users/${userId}`, "receitas")
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { data: docSnap.data().receitas as Receita[], error: null }
    }
    return { data: null, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

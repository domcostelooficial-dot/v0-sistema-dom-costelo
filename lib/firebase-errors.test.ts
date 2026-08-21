import { describe, expect, it, vi } from "vitest"
import { traduzirErroFirebase } from "./firebase-errors"
import { removerUndefinedFirestore } from "./firebase-db"
import { Timestamp } from "firebase/firestore"

describe("tradução de erros Firebase", () => {
  it("não expõe erro técnico de banco ausente", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    expect(traduzirErroFirebase(new Error("The database (default) does not exist for project 667754972644"))).toBe("O sistema está temporariamente sem conexão com o banco de dados.")
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

describe("sanitização de dados Firestore", () => {
  it("remove undefined e preserva valores válidos e Timestamp", () => {
    const timestamp = Timestamp.now()
    expect(removerUndefinedFirestore({ displayName: undefined, email: "admin@dom.com", nulo: null, timestamp, nested: { criadoPorNome: undefined, ok: true }, lista: [1, undefined, 2] })).toEqual({ email: "admin@dom.com", nulo: null, timestamp, nested: { ok: true }, lista: [1, 2] })
  })
})

  it("traduz permissões e falhas genéricas", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    expect(traduzirErroFirebase({ code: "permission-denied", message: "Missing or insufficient permissions" })).toBe("Você não tem permissão para salvar esta alteração.")
    expect(traduzirErroFirebase(new Error("FirebaseError: internal"))).toBe("Não foi possível salvar a alteração. Tente novamente.")
    spy.mockRestore()
  })
})

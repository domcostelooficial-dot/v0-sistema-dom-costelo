export function traduzirErroFirebase(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : ""
  const message = error instanceof Error ? error.message : String(error ?? "")
  const technical = `${code} ${message}`.toLowerCase()

  console.error("[Firebase] Erro técnico:", error)

  if (technical.includes("database (default) does not exist") || technical.includes("database_not_found")) {
    console.error("Firestore (default) não está provisionado no projeto domcostelo-pro.")
    return "O sistema está temporariamente sem conexão com o banco de dados."
  }
  if (technical.includes("permission-denied") || technical.includes("missing or insufficient permissions")) {
    return "Você não tem permissão para salvar esta alteração."
  }
  if (technical.includes("estoque insuficiente")) return "A quantidade disponível não é suficiente."
  if (technical.includes("insumo não encontrado") || technical.includes("item não encontrado")) return "Não foi possível localizar este item no estoque."
  if (technical.includes("unidade_incompativel")) return "A unidade deste item não é compatível com a movimentação."
  return "Não foi possível salvar a alteração. Tente novamente."
}

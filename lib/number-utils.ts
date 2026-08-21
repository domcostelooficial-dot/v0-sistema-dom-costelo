export function parseNumeroSeguro(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback
  if (typeof value !== "string") return fallback
  const normalized = value.trim().replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function quantidadeValida(value: unknown): boolean {
  const parsed = parseNumeroSeguro(value, Number.NaN)
  return Number.isFinite(parsed) && parsed >= 0
}

export function moedaCentavos(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100
}

export function multiplicarMoeda(quantidade: number, unitario: number): number {
  return moedaCentavos(quantidade * unitario)
}

export function formatarMoeda(value: number): string {
  return moedaCentavos(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

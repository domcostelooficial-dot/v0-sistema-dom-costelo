import { describe, expect, it } from "vitest"
import { formatarMoeda, moedaCentavos, multiplicarMoeda, parseNumeroSeguro, quantidadeValida } from "./number-utils"

describe("number-utils", () => {
  it("aceita formatos brasileiros e rejeita valores inválidos", () => {
    expect(parseNumeroSeguro("1.234,56")).toBe(1234.56)
    expect(parseNumeroSeguro("abc", 7)).toBe(7)
    expect(quantidadeValida("2,5")).toBe(true)
    expect(quantidadeValida("-1")).toBe(false)
  })
  it("arredonda cálculos monetários em centavos", () => {
    expect(moedaCentavos(10.005)).toBe(10.01)
    expect(multiplicarMoeda(3, 1.999)).toBe(6)
    expect(formatarMoeda(12.5)).toContain("12,50")
  })
})

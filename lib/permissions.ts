import type { TabPermissao, UserRole, UsuarioSistema } from "./types"

export type PermissaoChave = Exclude<TabPermissao, "lista-compras" | "cmv"> | "listaCompras" | "fichaTecnica"

export const MODULOS_PERMISSAO = [
  { key: "estoque", label: "Estoque", tab: "estoque" },
  { key: "entrada", label: "Entrada", tab: "entrada" },
  { key: "saida", label: "Saída", tab: "saida" },
  { key: "inventario", label: "Inventário", tab: "inventario" },
  { key: "financeiro", label: "Financeiro", tab: "financeiro" },
  { key: "dashboard", label: "Dashboard", tab: "dashboard" },
  { key: "listaCompras", label: "Lista de Compras", tab: "listaCompras" },
  { key: "fichaTecnica", label: "Ficha Técnica e CMV", tab: "fichaTecnica" },
  { key: "admin", label: "Administração", tab: "admin" },
] as const

const LEGADAS: Record<string, PermissaoChave> = {
  "lista-compras": "listaCompras",
  cmv: "fichaTecnica",
}

export function normalizarPermissoes(permissoes: readonly string[] | undefined): PermissaoChave[] {
  return Array.from(new Set((permissoes ?? []).map((permissao) => LEGADAS[permissao] ?? permissao).filter((permissao): permissao is PermissaoChave => MODULOS_PERMISSAO.some((modulo) => modulo.key === permissao))))
}

export function usuarioPodeAcessar(usuario: Pick<UsuarioSistema, "role" | "status" | "ativo" | "permissoes"> | null | undefined, permissao: string) {
  if (!usuario || usuario.status !== "aprovado" || usuario.ativo !== true) return false
  if (usuario.role === "owner" || usuario.role === "admin") return true
  return normalizarPermissoes(usuario.permissoes).includes(permissao as PermissaoChave)
}

export function primeiroModuloPermitido(usuario: Pick<UsuarioSistema, "role" | "status" | "ativo" | "permissoes"> | null | undefined): PermissaoChave | null {
  return MODULOS_PERMISSAO.find((modulo) => usuarioPodeAcessar(usuario, modulo.key))?.key ?? null
}

export function perfilNormalizado(usuario: UsuarioSistema): UsuarioSistema {
  return { ...usuario, permissoes: normalizarPermissoes(usuario.permissoes) as TabPermissao[] }
}

export function roleTemAcessoTotal(role: UserRole) {
  return role === "owner" || role === "admin"
}

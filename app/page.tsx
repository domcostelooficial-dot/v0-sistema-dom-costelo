"use client"

import { useState, useEffect, useCallback } from "react"
import { Item, HistoricoEntry, Receita, Insumo, CompraRegistro, VendaFinanceira, DespesaFinanceira, FinanceConfig, MovimentacaoEstoque, defaultInsumos, aliasesPorInsumo } from "@/lib/types"
import {
  saveEstoque as saveEstoqueLocal,
  getEstoque as getEstoqueLocal,
  saveHistorico as saveHistoricoLocal,
  getHistorico as getHistoricoLocal,
  getReceitas as getReceitasLocal,
  saveReceitas as saveReceitasLocal,
} from "@/lib/store"
import {
  saveEstoque as saveEstoqueFirebase,
  getEstoque as getEstoqueFirebase,
  saveHistorico as saveHistoricoFirebase,
  getHistorico as getHistoricoFirebase,
  saveReceitas as saveReceitasFirebase,
  getReceitas as getReceitasFirebase,
  subscribeToEstoque,
  subscribeToHistorico,
  subscribeToReceitas,
  getInsumos,
  migrarCustosMestresDomCosteloV1,
  saveInsumos,
  getFichasTecnicas,
  initializeFichasTecnicas,
  migrarFichasTecnicasV2,
  saveFichasTecnicas,
  getCombos,
  saveCombos,
  migrarCombosV1,
  getComprasHistorico,
  saveComprasHistorico,
  getFinanceConfig,
  saveFinanceConfig,
  getVendasFinanceiras,
  saveVendasFinanceiras,
  getDespesasFinanceiras,
  saveDespesasFinanceiras,
  getFinanceAuditSnapshots,
  saveFinanceAuditSnapshot,
  getMovimentacoesEstoque,
  saveMovimentacoesEstoque,
  registrarEntradaAtomica,
  registrarSaidaAtomica,
  ajustarEstoqueAtomico,
  ajustarInventarioAtomico,
  registrarBaixaVendaAtomica,
  registrarBaixaBloqueada,
  estornarMovimentacaoAtomica,
} from "@/lib/firebase-db"
import { criarEntrada, criarSaida } from "@/lib/estoque-movements"
import { SaidaEstoqueView } from "@/components/saida-estoque-view"
import { InventarioView } from "@/components/inventario-view"
import { BaixasPendentesView } from "@/components/baixas-pendentes-view"
import { toast } from "sonner"
import type { FinanceAuditSnapshot } from "@/lib/finance-engine"
import { FirebaseLoginForm } from "@/components/firebase-login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { EstoqueView } from "@/components/estoque-view"
import { EntradaView } from "@/components/entrada-view"
import { FinanceiroCentral } from "@/components/financeiro-central"
import { DashboardView } from "@/components/dashboard-view"
import { ListaComprasView } from "@/components/lista-compras-view"
import { AdminView } from "@/components/admin-view"
import { CmvView } from "@/components/cmv-view"
import { seedFichas, calcularConsumoVenda, calcularConsumoComboVenda, migrarFichasParaCarneKg } from "@/lib/cmv-engine"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

type Tab = "estoque" | "entrada" | "saida" | "inventario" | "financeiro" | "dashboard" | "lista-compras" | "cmv" | "admin"

const ITENS_REMOVIDOS = new Set(["Costela Crua", "Contra filé", "Manteiga de Garrafa", "Limoneto"])

function limparItensEstoque(itens: Item[]) {
  const vistos = new Set<string>()
  return itens
    .filter((item) => !ITENS_REMOVIDOS.has(item.nome))
    .map((item) => item.nome === "Aji Sal para churrasco" ? { ...item, nome: "Sal" } : item)
    .filter((item) => !vistos.has(item.nome) && (vistos.add(item.nome), true))
}

// Funções wrapper que salvam em Firebase e localStorage
async function saveEstoqueHybrid(user: string | null, itens: Item[]) {
  const itensPersistidos = limparItensEstoque(itens)
  if (user) {
    const result = await saveEstoqueFirebase(user, itensPersistidos)
    if (result?.error) throw new Error(result.error)
  }
  saveEstoqueLocal(itensPersistidos)
  return { error: null }
}

async function getEstoqueHybrid(user: string | null): Promise<Item[]> {
  if (user) {
    try {
      const result = await getEstoqueFirebase(user)
      if (result.error) throw new Error(result.error)
      const { data } = result
      if (data !== null) {
        console.log("[v0] Estoque carregado do Firebase")
        return limparItensEstoque(data)
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar do Firebase:", err)
    }
  }
  return limparItensEstoque(getEstoqueLocal())
}

async function saveHistoricoHybrid(user: string | null, historico: HistoricoEntry[]) {
  if (user) {
    const result = await saveHistoricoFirebase(user, historico)
    if (result?.error) throw new Error(result.error)
  }
  saveHistoricoLocal(historico)
}

async function getHistoricoHybrid(user: string | null): Promise<HistoricoEntry[]> {
  if (user) {
    try {
      const result = await getHistoricoFirebase(user)
      if (result.error) throw new Error(result.error)
      const { data } = result
      if (data !== null) {
        console.log("[v0] Histórico carregado do Firebase")
        return data
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar histórico do Firebase:", err)
    }
  }
  return getHistoricoLocal()
}

async function saveReceitasHybrid(user: string | null, receitas: Receita[]) {
  if (user) {
    const result = await saveReceitasFirebase(user, receitas)
    if (result?.error) throw new Error(result.error)
  }
  saveReceitasLocal(receitas)
}

async function getReceitasHybrid(user: string | null): Promise<Receita[]> {
  if (user) {
    try {
      const result = await getReceitasFirebase(user)
      if (result.error) throw new Error(result.error)
      const { data } = result
      if (data !== null) {
        console.log("[v0] Receitas carregadas do Firebase")
        return data
      }
    } catch (err) {
      console.error("[v0] Erro ao carregar receitas do Firebase:", err)
    }
  }
  return getReceitasLocal()
}

export default function Home() {
  const [user, setUser] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [userPermissoes, setUserPermissoes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("estoque")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [itens, setItens] = useState<Item[]>([])
  const [historico, setHistorico] = useState<HistoricoEntry[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>(defaultInsumos)
  const [comprasHistorico, setComprasHistorico] = useState<CompraRegistro[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [fichasTecnicas, setFichasTecnicas] = useState<typeof seedFichas>([])
  const [combos, setCombos] = useState<import("@/lib/types").Combo[]>([])
  const [fichasLoading, setFichasLoading] = useState(true)
  const [financeConfig, setFinanceConfig] = useState<FinanceConfig | undefined>(undefined)
  const [vendasFinanceiras, setVendasFinanceiras] = useState<VendaFinanceira[]>([])
  const [despesasFinanceiras, setDespesasFinanceiras] = useState<DespesaFinanceira[]>([])
 const [auditoriaJulho, setAuditoriaJulho] = useState<FinanceAuditSnapshot | undefined>(undefined)
  const persistirFichas = async (data: typeof seedFichas) => {
    if (userRole !== "owner" && userRole !== "admin") return false
    try {
      await saveFichasTecnicas(data)
      setFichasTecnicas(data)
      toast.success("Ficha técnica sincronizada na nuvem.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar a ficha técnica.")
      return false
    }
  }

  const getComprasHybrid = async (roleOverride?: string) => {
    const roleAtual = roleOverride ?? userRole
    try {
  const [insumosResult, historicoResult, fichasResult, movimentacoesResult, combosResult] = await Promise.all([getInsumos(), getComprasHistorico(), getFichasTecnicas(), getMovimentacoesEstoque(), getCombos()])
  const custosMestres = roleAtual === "owner" || roleAtual === "admin" ? (await migrarCustosMestresDomCosteloV1(defaultInsumos)).data : insumosResult
  const carneOficial = defaultInsumos.find((item) => item.id === "carne-hamburguer-kg")!
  const insumosResultAtualizados = custosMestres.length > 0 ? custosMestres : insumosResult
  const insumosOperacionais = insumosResultAtualizados.length > 0 ? [...insumosResultAtualizados, ...defaultInsumos.filter((item) => !insumosResultAtualizados.some((existente) => existente.id === item.id || existente.nome === item.nome))] : defaultInsumos
  if (insumosOperacionais.length > 0) setInsumos(insumosOperacionais)
  if (historicoResult.length > 0) setComprasHistorico(historicoResult)
  const fichasBase = fichasResult.length > 0 ? fichasResult : seedFichas
  const migradas = migrarFichasParaCarneKg(fichasBase, insumosOperacionais)
  setFichasTecnicas(migradas.length > 0 ? migradas : seedFichas)
  if (roleAtual === "owner" || roleAtual === "admin") {
  const migracao = await migrarFichasTecnicasV2(seedFichas, insumosOperacionais, aliasesPorInsumo)
  if (migracao.data.length > 0) setFichasTecnicas(migracao.data)
  if (migracao.errors.length > 0) console.error("[v0] Migração V2 bloqueada:", migracao.errors)
  }
  if (movimentacoesResult.length > 0) setMovimentacoes(movimentacoesResult)
  if (roleAtual === "owner" || roleAtual === "admin") {
    const combosMigrados = await migrarCombosV1((await import("@/lib/cmv-engine")).seedCombos)
    setCombos(combosMigrados.data)
  } else if (combosResult.length > 0) setCombos(combosResult)
    } catch (err) {
      console.error("[v0] Erro ao carregar dados financeiros do estoque:", err)
    }
  }
  const persistirInsumos = async (data: Insumo[]) => {
    if (userRole !== "owner" && userRole !== "admin") return
    try { await saveInsumos(data); setInsumos(data); toast.success("Produtos sincronizados na nuvem.") }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar os produtos."); throw error }
  }
  const persistirCompras = async (data: CompraRegistro[]) => {
    try { await saveComprasHistorico(data); setComprasHistorico(data); toast.success("Compra sincronizada na nuvem.") }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar a compra."); throw error }
  }
  const estornarMovimentacao = async (movimentacao: MovimentacaoEstoque) => {
    if (userRole !== "owner" && userRole !== "admin") { toast.error("Você não tem permissão para estornar entradas."); return }
    try {
      await estornarMovimentacaoAtomica({ movimentoId: movimentacao.id, usuario: { uid: auth.currentUser?.uid ?? "unknown", email: auth.currentUser?.email ?? undefined, nome: auth.currentUser?.displayName ?? undefined } })
      const next = await getMovimentacoesEstoque(); setMovimentacoes(next); setItens(await getEstoqueHybrid(user)); toast.success("Entrada estornada com sucesso.")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível estornar a entrada.") }
  }

  const registrarEntradaRastreavel = async (nome: string, qtd: number, custo: number, fornecedor?: string, observacao?: string, dataMovimentacao?: string) => {
    const item = itens.find((row) => row.nome === nome)
    const insumo = insumos.find((row) => row.id === item?.insumoId || row.nome === nome)
    if (!userPermissoes.includes("entrada") && userRole !== "owner" && userRole !== "admin") throw new Error("Você não tem permissão para registrar entrada.")
    if (!item || !insumo || item.ativo === false || item.naoVinculado === true) throw new Error("Este item não está disponível para entrada.")
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("Usuário autenticado não encontrado.")
    const unidade = (item.unidadeEstoque === "Unidade" ? "un" : item.unidadeEstoque) as Insumo["unidade"]
    const movimento = { ...criarEntrada({ insumo: { ...insumo, id: item.insumoId ?? insumo.id }, quantidade: qtd, unidade, precoUnitario: qtd > 0 ? custo / qtd : 0, fornecedor, observacao, dataMovimentacao, usuario: { id: currentUser.uid, email: currentUser.email ?? undefined, nome: currentUser.displayName ?? undefined } }), status: "ativa" as const }
    const atualizados = await registrarEntradaAtomica({ movimento, itemNome: nome, userId: currentUser.uid })
    setItens(atualizados); setMovimentacoes(await getMovimentacoesEstoque()); toast.success("Entrada registrada com sucesso.")
  }

  const processarBaixaVenda = async (venda: VendaFinanceira) => {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("Usuário autenticado não encontrado.")
    const ficha = fichasTecnicas.find((item) => item.id === venda.fichaTecnicaId || item.id === venda.produtoId || item.nome.toLowerCase() === venda.produtoNome.toLowerCase())
    const comboAtual = combos.find((item) => item.id === venda.produtoId || item.nome.toLowerCase() === venda.produtoNome.toLowerCase())
    const combo = Boolean(comboAtual)
    if (combo && !comboAtual?.itens.length) {
      await registrarBaixaBloqueada({ venda, codigo: "COMBO_SEM_COMPOSICAO", mensagem: "Combo sem composição cadastrada para baixa automática.", userId: currentUser.uid })
      setVendasFinanceiras((rows) => rows.map((row) => row.id === venda.id ? { ...row, statusBaixa: "bloqueada", estoqueStatus: "bloqueada", motivoBloqueio: "COMBO_SEM_COMPOSICAO: Combo sem composição cadastrada para baixa automática." } : row))
      throw new Error("COMBO_SEM_COMPOSICAO: Combo sem composição cadastrada para baixa automática.")
    }
    const consumo = comboAtual ? calcularConsumoComboVenda(venda, comboAtual, fichasTecnicas, insumos, itens) : calcularConsumoVenda(venda, ficha, insumos, itens)
    if (!consumo.ok) {
      const codigo = consumo.codigo ?? (!ficha ? "PRODUTO_SEM_FICHA" : "ERRO_PROCESSAMENTO")
      await registrarBaixaBloqueada({ venda, codigo, mensagem: consumo.motivo, userId: currentUser.uid })
      setVendasFinanceiras((rows) => rows.map((row) => row.id === venda.id ? { ...row, statusBaixa: "bloqueada", estoqueStatus: "bloqueada", motivoBloqueio: `${codigo}: ${consumo.motivo}` } : row))
      throw new Error(`${codigo}: ${consumo.motivo}`)
    }
    if (!ficha) throw new Error("PRODUTO_SEM_FICHA: Ficha técnica não encontrada")
    if (venda.statusBaixa === "baixada") return
    if (userRole !== "owner" && userRole !== "admin" && userRole !== "operador") throw new Error("Papel sem permissão para baixa automática derivada de venda.")
    const agora = new Date().toISOString()
    const result = await registrarBaixaVendaAtomica({ venda, consumos: consumo.consumos.map((item) => ({ insumoId: item.insumo.id, insumoNomeSnapshot: item.insumo.nome, quantidadeBase: item.quantidadeBase, unidadeBase: item.unidadeEstoque, quantidadeFicha: item.quantidade, unidadeFicha: item.unidadeBase })), userId: currentUser.uid, agora, canalVenda: venda.canalNaVenda })
    setItens(result.itens)
    setVendasFinanceiras((rows) => rows.map((row) => row.id === venda.id ? { ...row, statusBaixa: "baixada", estoqueStatus: "baixada", baixaId: result.baixaId } : row))
    setMovimentacoes(await getMovimentacoesEstoque())
    toast.success(result.idempotente ? "Venda já estava baixada." : "Baixa de venda registrada.")
  }

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const storedItens = await getEstoqueHybrid(null)
      const storedHistorico = await getHistoricoHybrid(null)
      const storedReceitas = await getReceitasHybrid(null)
      setItens(storedItens)
      setHistorico(storedHistorico)
      setReceitas(storedReceitas)
      setIsLoading(false)
    }
    
    loadData()
  }, [])
  
  // Setup real-time listeners only when user is logged in
  useEffect(() => {
    if (!user) return
    
    // Configurar listeners em tempo real para sincronização (apenas quando logado)
    const unsubscribeEstoque = subscribeToEstoque((firebaseItens) => {
      if (firebaseItens) {
        const itensLimpos = limparItensEstoque(firebaseItens)
        setItens(itensLimpos)
        saveEstoqueLocal(itensLimpos)
      }
    })
    
    const unsubscribeHistorico = subscribeToHistorico((firebaseHistorico) => {
      if (firebaseHistorico) {
        setHistorico(firebaseHistorico)
        saveHistoricoLocal(firebaseHistorico)
      }
    })
    
    const unsubscribeReceitas = subscribeToReceitas((firebaseReceitas) => {
      if (firebaseReceitas) {
        setReceitas(firebaseReceitas)
        saveReceitasLocal(firebaseReceitas)
      }
    })
    
    // Cleanup listeners on unmount or logout
    return () => {
      unsubscribeEstoque()
      unsubscribeHistorico()
      unsubscribeReceitas()
    }
  }, [user])

  const handleLogin = (username: string, role: string, permissoes: string[]) => {
    setUser(username)
    setUserRole(role)
    setUserPermissoes(permissoes)
    
    // Recarregar dados do Firebase do novo usuario
    const loadUserData = async () => {
      const itens = await getEstoqueHybrid(username)
      const historico = await getHistoricoHybrid(username)
      const receitas = await getReceitasHybrid(username)
      let fichas = { data: seedFichas, seeded: false }
      try {
        fichas = await initializeFichasTecnicas(seedFichas)
      } catch (error) {
        console.error("[v0] Firebase indisponível; usando fichas padrão:", error)
      }
      const [config, vendas, despesas, auditorias] = await Promise.all([getFinanceConfig().catch(() => undefined), getVendasFinanceiras().catch(() => []), getDespesasFinanceiras().catch(() => []), getFinanceAuditSnapshots().catch(() => [])])
      setFinanceConfig(config)
      setAuditoriaJulho(auditorias.find(item => item.competencia === "2026-07"))
      setVendasFinanceiras(vendas)
      setDespesasFinanceiras(despesas)
      setFichasTecnicas(fichas.data)
      setFichasLoading(false)
      await getComprasHybrid(role)
      
      setItens(itens)
      setHistorico(historico)
      setReceitas(receitas)
    }
    loadUserData()
    
    // Set first allowed tab as active
    const firstAllowedTab = permissoes[0] as Tab
    setActiveTab(firstAllowedTab || "estoque")
  }

  const handleLogout = async () => {
    await signOut(auth)
    setUser(null)
    setUserRole("")
    setUserPermissoes([])
  }

  const handlePasswordChange = () => {
    // Force re-login after password change
    handleLogout()
  }

  const handleAddItem = async (newItem: Item) => {
    const now = new Date()
    const dataHora = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    const itemWithTimestamp = {
      ...newItem,
      ultimaAlteracao: {
        usuario: user || "Desconhecido",
        data: dataHora,
      },
    }
    const updated = [...itens, itemWithTimestamp]
    try {
      await saveEstoqueHybrid(user, updated)
      setItens(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o novo item na nuvem.")
    }
  }

  const handleEditItem = (oldNome: string, updatedItem: Item) => {
    const now = new Date()
    const dataHora = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    const updated = itens.map((item) =>
      item.nome === oldNome
        ? {
            ...updatedItem,
            ultimaAlteracao: {
              usuario: user || "Desconhecido",
              data: dataHora,
            },
          }
        : item
    )
    setItens(updated)
    saveEstoqueHybrid(user, updated)
  }

  const handleDeleteItem = (nome: string) => {
    if (userRole !== "owner" && userRole !== "admin") return
    const updated = itens.filter((item) => item.nome !== nome)
    setItens(updated)
    saveEstoqueHybrid(user, updated)
  }

  const handleEntrada = async (nome: string, qtd: number, custo: number, fornecedor?: string, observacao?: string, dataMovimentacao?: string) => {
    try {
      await registrarEntradaRastreavel(nome, qtd, custo, fornecedor, observacao, dataMovimentacao)
    } catch (error) {
      const item = itens.find((row) => row.nome === nome)
      if (!item) throw error
      const atualizados = itens.map((row) => row.nome === nome ? { ...row, atual: row.atual + qtd } : row)
      saveEstoqueLocal(atualizados)
      setItens(atualizados)
      toast.warning("Entrada salva neste dispositivo, mas não foi sincronizada com o banco de dados.")
      console.error("[v0] Falha ao sincronizar entrada:", error)
    }
  }

  const aplicarInventario = async (item: Item, base: number, contado: number, motivo: NonNullable<MovimentacaoEstoque["motivo"]>, observacao?: string) => {
    if (userRole !== "owner" && userRole !== "admin") throw new Error("Somente owner/admin podem aplicar ajustes de inventário.")
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("Usuário autenticado não encontrado.")
    const diferenca = contado - base
    if (diferenca === 0) return
    const agora = new Date().toISOString()
    const movimento: MovimentacaoEstoque = { id: crypto.randomUUID(), tipo: "ajuste_inventario", insumoId: item.insumoId ?? item.id ?? item.nome, insumoNomeSnapshot: item.nome, quantidade: diferenca, unidadeSnapshot: (item.unidadeEstoque === "Unidade" ? "un" : item.unidadeEstoque ?? item.unidade ?? "un") as Insumo["unidade"], quantidadeBase: diferenca, unidadeBase: (item.unidadeEstoque === "Unidade" ? "un" : item.unidadeEstoque ?? item.unidade ?? "un") as Insumo["unidade"], precoUnitarioSnapshot: item.custoUnitario ?? item.preco ?? 0, valorTotal: diferenca * (item.custoUnitario ?? item.preco ?? 0), origem: "estoque", motivo, observacao, estoqueAnterior: base, estoqueContado: contado, diferenca, status: "ativa", usuarioId: currentUser.uid, usuarioEmail: currentUser.email ?? "", criadoPorUid: currentUser.uid, criadoPorEmail: currentUser.email ?? undefined, criadoPorNome: currentUser.displayName ?? undefined, dataMovimentacao: agora, criadoEm: agora }
    try {
      const atualizados = await ajustarInventarioAtomico({ itemNome: item.nome, insumoId: item.insumoId, estoqueBaseDaContagem: base, estoqueContado: contado, movimento, userId: currentUser.uid })
      setItens(atualizados); setMovimentacoes(await getMovimentacoesEstoque()); toast.success("Ajuste de inventário aplicado.")
    } catch (error) {
      if (error instanceof Error && error.message === "CONCORRENCIA_INVENTARIO") { const atualizados = await getEstoqueHybrid(user); setItens(atualizados); toast.error("O estoque deste item foi alterado após o início da conferência. Atualize a contagem antes de aplicar o ajuste.") }
      throw error
    }
  }

  const registrarSaida = async (nome: string, quantidade: number, motivo: NonNullable<MovimentacaoEstoque["motivo"]>, observacao?: string) => {
    if (!userPermissoes.includes("saida") && userRole !== "owner" && userRole !== "admin") throw new Error("Você não tem permissão para registrar saídas.")
    const item = itens.find((row) => row.nome === nome)
    const insumo = insumos.find((row) => row.id === item?.insumoId || row.nome === nome)
    const currentUser = auth.currentUser
    if (!item || !insumo || !currentUser || item.ativo === false || item.naoVinculado === true) throw new Error("Este item não está disponível para saída.")
    const unidade = (item.unidadeEstoque === "Unidade" ? "un" : item.unidadeEstoque) as Insumo["unidade"]
    const movimento = criarSaida({ insumo: { ...insumo, id: item.insumoId ?? insumo.id }, quantidade, unidade, motivo, observacao, usuario: { id: currentUser.uid, email: currentUser.email ?? undefined, nome: currentUser.displayName ?? undefined } })
    const atualizados = await registrarSaidaAtomica({ movimento, itemNome: nome, userId: currentUser.uid })
    setItens(atualizados); setMovimentacoes(await getMovimentacoesEstoque()); toast.success("Saída registrada com sucesso.")
  }

  const handleProduzir = (receita: Receita) => {
    const now = new Date()
    const dataHora = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    
    const alteracao = {
      usuario: user || "Desconhecido",
      data: dataHora,
    }
    const updated = itens.map((item) => {
      if (item.nome === receita.inputItem) {
        return { ...item, atual: item.atual - receita.inputQtd, ultimaAlteracao: alteracao }
      }
      if (item.nome === receita.outputItem) {
        return { ...item, atual: item.atual + receita.outputQtd, ultimaAlteracao: alteracao }
      }
      return item
    })
    setItens(updated)
    saveEstoqueHybrid(user, updated)
  }

  const handleAddReceita = (receita: Receita) => {
    const newReceitas = [...receitas, receita]
    setReceitas(newReceitas)
    saveReceitasHybrid(user, newReceitas)
  }

  const handleUpdateReceita = (receita: Receita) => {
    const updated = receitas.map((r) => (r.id === receita.id ? receita : r))
    setReceitas(updated)
    saveReceitasHybrid(user, updated)
  }

  const handleDeleteReceita = (id: string) => {
    const filtered = receitas.filter((r) => r.id !== id)
    setReceitas(filtered)
    saveReceitasHybrid(user, filtered)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <FirebaseLoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        user={user}
        userRole={userRole}
        userPermissoes={userPermissoes}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="min-h-screen md:ml-64">
        <div className="p-4 pt-16 md:p-10 md:pt-10">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-2 border-b border-border/70 pb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dom Costelo · Gestão</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground capitalize">
              {activeTab === "estoque" && "Controle de Estoque"}
              {activeTab === "entrada" && "Entrada de Mercadoria"}
              {activeTab === "saida" && "Saída de Estoque"}
              {activeTab === "inventario" && "Inventário"}
              {activeTab === "financeiro" && "Financeiro"}
              {activeTab === "dashboard" && "Dashboard"}
 {activeTab === "lista-compras" && "Lista de Compras"}
 {activeTab === "cmv" && "Ficha Técnica e CMV"}
 {activeTab === "admin" && "Administração"}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "estoque" &&
                "Gerencie os itens do seu estoque"}
              {activeTab === "entrada" &&
                "Registre novas entradas de mercadoria"}
              {activeTab === "saida" && "Registre saídas, perdas e consumos do estoque"}
              {activeTab === "inventario" && "Compare o estoque do sistema com a contagem física"}
              {activeTab === "financeiro" &&
                "Acompanhe seus gastos e histórico"}
              {activeTab === "dashboard" &&
                "Visualize as métricas do seu negócio"}
 {activeTab === "lista-compras" &&
  "Itens com estoque baixo, quantidades e valor total da compra"}
 {activeTab === "cmv" && "Custos centralizados, fichas técnicas e margens"}
 {activeTab === "admin" &&
                "Gerenciamento de usuários, permissões e configurações"}
            </p>
          </div>

          {/* Content */}
          {activeTab === "estoque" && <div className="flex flex-col gap-6"><EstoqueView
              itens={itens}
  onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              userRole={userRole as "admin" | "operador" | "owner"}
              movimentacoes={movimentacoes}
              onEstornarMovimentacao={estornarMovimentacao}
            /><BaixasPendentesView vendas={vendasFinanceiras} onProcessar={async (venda) => { try { await processarBaixaVenda(venda) } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível processar a baixa.") } }} /></div>}
          {activeTab === "entrada" && (
            <EntradaView itens={itens} insumos={insumos} onEntrada={handleEntrada} canRegister={userPermissoes.includes("entrada") || userRole === "owner" || userRole === "admin"} />
          )}
          {activeTab === "inventario" && <InventarioView itens={itens} userRole={userRole} onAplicar={aplicarInventario} />}
          {activeTab === "saida" && <SaidaEstoqueView itens={itens} canRegister={userPermissoes.includes("saida") || userRole === "owner" || userRole === "admin"} onSaida={registrarSaida} />}
          {activeTab === "financeiro" && (
            <FinanceiroCentral
              fichas={fichasTecnicas}
              combos={combos}
              insumos={insumos}
              vendas={vendasFinanceiras}
              despesas={despesasFinanceiras}
              config={financeConfig}
              userRole={userRole}
              onSaveConfig={(nextConfig) => { setFinanceConfig(nextConfig); saveFinanceConfig(nextConfig).catch((error) => console.error("[v0] Erro ao salvar configuração financeira:", error)) }}
              onAddVenda={(venda) => { const vendaEfetivada = { ...venda, fichaTecnicaId: venda.fichaTecnicaId ?? venda.produtoId, statusBaixa: "pendente" as const, estoqueStatus: "pendente" as const }; const next = [...vendasFinanceiras, vendaEfetivada]; setVendasFinanceiras(next); saveVendasFinanceiras(next).then(() => processarBaixaVenda(vendaEfetivada)).catch((error) => console.error("[v0] Erro ao salvar/processar venda:", error)) }}
              onAddDespesa={(despesa) => { const next = [...despesasFinanceiras, despesa]; setDespesasFinanceiras(next); saveDespesasFinanceiras(next).catch((error) => console.error("[v0] Erro ao salvar despesa:", error)) }}
  auditoriaJulho={auditoriaJulho}
  onSaveAuditoria={(snapshot) => { setAuditoriaJulho(snapshot); saveFinanceAuditSnapshot(snapshot).catch((error) => console.error("[v0] Erro ao salvar auditoria financeira:", error)) }}
            />
          )}
          {activeTab === "dashboard" && (
            <DashboardView itens={itens} historico={historico} vendasFinanceiras={vendasFinanceiras} despesasFinanceiras={despesasFinanceiras} financeConfig={financeConfig} />
          )}
          {activeTab === "lista-compras" && (
            <ListaComprasView
              itens={itens}
              user={user}
              userRole={userRole}
              fichas={fichasTecnicas}
              insumos={insumos}
              historico={comprasHistorico}
              onSaveInsumos={persistirInsumos}
              onSaveHistorico={persistirCompras}
  onConfirmarCompra={async (linhas) => {
  for (const linha of linhas) {
  await registrarEntradaRastreavel(linha.nome, linha.quantidade, linha.quantidade * linha.unitario, linha.fornecedor, `Compra confirmada · ${linha.data}` , linha.data)
  }
  }}
            />
          )}
  {activeTab === "cmv" && (
  <CmvView insumos={insumos} fichas={fichasTecnicas} combos={combos} userRole={userRole} onSaveInsumos={persistirInsumos} onSaveFichas={persistirFichas} onSaveCombos={(data) => { setCombos(data); saveCombos(data).catch((error) => console.error("[v0] Erro ao salvar combos:", error)) }} />
  )}
  {activeTab === "admin" && (userRole === "admin" || userRole === "owner") && (
  <AdminView currentUser={user} onPasswordChange={handlePasswordChange} />
  )}
        </div>
      </main>
    </div>
  )
}

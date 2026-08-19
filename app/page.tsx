"use client"

import { useState, useEffect, useCallback } from "react"
import { Item, HistoricoEntry, Receita, Insumo, CompraRegistro, VendaFinanceira, DespesaFinanceira, FinanceConfig, defaultInsumos } from "@/lib/types"
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
  saveInsumos,
  getFichasTecnicas,
  initializeFichasTecnicas,
  saveFichasTecnicas,
  getComprasHistorico,
  saveComprasHistorico,
  getFinanceConfig,
  saveFinanceConfig,
  getVendasFinanceiras,
  saveVendasFinanceiras,
  getDespesasFinanceiras,
  saveDespesasFinanceiras,
} from "@/lib/firebase-db"
import { FirebaseLoginForm } from "@/components/firebase-login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { EstoqueView } from "@/components/estoque-view"
import { EntradaView } from "@/components/entrada-view"
import { FinanceiroCentral } from "@/components/financeiro-central"
import { DashboardView } from "@/components/dashboard-view"
import { ListaComprasView } from "@/components/lista-compras-view"
import { AdminView } from "@/components/admin-view"
import { CmvView } from "@/components/cmv-view"
import { seedFichas } from "@/lib/cmv-engine"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

type Tab = "estoque" | "entrada" | "financeiro" | "dashboard" | "lista-compras" | "cmv" | "admin"

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
  saveEstoqueLocal(itensPersistidos)
  if (user) {
    try {
      await saveEstoqueFirebase(user, itensPersistidos)
      console.log("[v0] Estoque salvo no Firebase")
    } catch (err) {
      console.error("[v0] Erro ao salvar no Firebase:", err)
    }
  }
}

async function getEstoqueHybrid(user: string | null): Promise<Item[]> {
  if (user) {
    try {
      const { data } = await getEstoqueFirebase(user)
      if (data && data.length > 0) {
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
  saveHistoricoLocal(historico)
  if (user) {
    try {
      await saveHistoricoFirebase(user, historico)
      console.log("[v0] Histórico salvo no Firebase")
    } catch (err) {
      console.error("[v0] Erro ao salvar histórico no Firebase:", err)
    }
  }
}

async function getHistoricoHybrid(user: string | null): Promise<HistoricoEntry[]> {
  if (user) {
    try {
      const { data } = await getHistoricoFirebase(user)
      if (data && data.length > 0) {
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
  saveReceitasLocal(receitas)
  if (user) {
    try {
      await saveReceitasFirebase(user, receitas)
      console.log("[v0] Receitas salvas no Firebase")
    } catch (err) {
      console.error("[v0] Erro ao salvar receitas no Firebase:", err)
    }
  }
}

async function getReceitasHybrid(user: string | null): Promise<Receita[]> {
  if (user) {
    try {
      const { data } = await getReceitasFirebase(user)
      if (data && data.length > 0) {
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
  const [fichasTecnicas, setFichasTecnicas] = useState<typeof seedFichas>([])
  const [fichasLoading, setFichasLoading] = useState(true)
  const [financeConfig, setFinanceConfig] = useState<FinanceConfig | undefined>(undefined)
  const [vendasFinanceiras, setVendasFinanceiras] = useState<VendaFinanceira[]>([])
  const [despesasFinanceiras, setDespesasFinanceiras] = useState<DespesaFinanceira[]>([])
  const persistirFichas = (data: typeof seedFichas) => { setFichasTecnicas(data); saveFichasTecnicas(data).catch((err) => console.error("[v0] Erro ao salvar fichas:", err)) }

  const getComprasHybrid = async () => {
    try {
  const [insumosResult, historicoResult, fichasResult] = await Promise.all([getInsumos(), getComprasHistorico(), getFichasTecnicas()])
  if (insumosResult.length > 0) setInsumos(insumosResult)
  if (historicoResult.length > 0) setComprasHistorico(historicoResult)
  if (fichasResult.length > 0) setFichasTecnicas(fichasResult)
    } catch (err) {
      console.error("[v0] Erro ao carregar dados financeiros do estoque:", err)
    }
  }
  const persistirInsumos = (data: Insumo[]) => { setInsumos(data); saveInsumos(data).catch((err) => console.error("[v0] Erro ao salvar preços:", err)) }
  const persistirCompras = (data: CompraRegistro[]) => { setComprasHistorico(data); saveComprasHistorico(data).catch((err) => console.error("[v0] Erro ao salvar compras:", err)) }

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
      if (firebaseItens && firebaseItens.length > 0) {
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
      if (firebaseReceitas && firebaseReceitas.length > 0) {
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
      const fichas = await initializeFichasTecnicas(seedFichas)
      const [config, vendas, despesas] = await Promise.all([getFinanceConfig(), getVendasFinanceiras(), getDespesasFinanceiras()])
      setFinanceConfig(config)
      setVendasFinanceiras(vendas)
      setDespesasFinanceiras(despesas)
      setFichasTecnicas(fichas.data)
      setFichasLoading(false)
      await getComprasHybrid()
      
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

  const handleUpdateItem = (nome: string, novoAtual: number) => {
    const now = new Date()
    const dataHora = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    const updated = itens.map((item) =>
      item.nome === nome
        ? {
            ...item,
            atual: novoAtual,
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

  const handleAddItem = (newItem: Item) => {
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
    setItens(updated)
    saveEstoqueHybrid(user, updated)
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
    if (userRole !== "admin") return
    const updated = itens.filter((item) => item.nome !== nome)
    setItens(updated)
    saveEstoqueHybrid(user, updated)
  }

  const handleEntrada = (nome: string, qtd: number, custo: number) => {
    const now = new Date()
    const dataHora = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    
    // Update estoque
    const updated = itens.map((item) =>
      item.nome === nome
        ? {
            ...item,
            atual: item.atual + qtd,
            ultimaAlteracao: {
              usuario: user || "Desconhecido",
              data: dataHora,
            },
          }
        : item
    )
    setItens(updated)
    saveEstoqueHybrid(user, updated)

    // Add to historico
    const entry: HistoricoEntry = {
      nome,
      qtd,
      custo,
      data: new Date().toLocaleDateString("pt-BR"),
    }
    const newHistorico = [...historico, entry]
    setHistorico(newHistorico)
    saveHistoricoHybrid(user, newHistorico)
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
          {activeTab === "estoque" && (
            <EstoqueView
              itens={itens}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              userRole={userRole as "admin" | "operador"}
            />
          )}
          {activeTab === "entrada" && (
            <EntradaView itens={itens} onEntrada={handleEntrada} />
          )}
          {activeTab === "financeiro" && (
            <FinanceiroCentral
              fichas={fichasTecnicas}
              insumos={insumos}
              vendas={vendasFinanceiras}
              despesas={despesasFinanceiras}
              config={financeConfig}
              userRole={userRole}
              onSaveConfig={(nextConfig) => { setFinanceConfig(nextConfig); saveFinanceConfig(nextConfig).catch((error) => console.error("[v0] Erro ao salvar configuração financeira:", error)) }}
              onAddVenda={(venda) => { const next = [...vendasFinanceiras, venda]; setVendasFinanceiras(next); saveVendasFinanceiras(next).catch((error) => console.error("[v0] Erro ao salvar venda:", error)) }}
              onAddDespesa={(despesa) => { const next = [...despesasFinanceiras, despesa]; setDespesasFinanceiras(next); saveDespesasFinanceiras(next).catch((error) => console.error("[v0] Erro ao salvar despesa:", error)) }}
            />
          )}
          {activeTab === "dashboard" && (
            <DashboardView itens={itens} historico={historico} />
          )}
          {activeTab === "lista-compras" && (
            <ListaComprasView
              itens={itens}
              user={user}
              insumos={insumos}
              historico={comprasHistorico}
              onSaveInsumos={persistirInsumos}
              onSaveHistorico={persistirCompras}
              onUpdateEstoque={(nome, qtd) => {
                const item = itens.find((current) => current.nome === nome)
                if (item) handleUpdateItem(nome, item.atual + qtd)
              }}
            />
          )}
  {activeTab === "cmv" && (
  <CmvView insumos={insumos} fichas={fichasTecnicas} onSaveInsumos={persistirInsumos} onSaveFichas={persistirFichas} />
  )}
  {activeTab === "admin" && userRole === "admin" && (
  <AdminView currentUser={user} onPasswordChange={handlePasswordChange} />
  )}
        </div>
      </main>
    </div>
  )
}

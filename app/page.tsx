"use client"

import { useState, useEffect } from "react"
import { Item, HistoricoEntry, Receita } from "@/lib/types"
import {
  getEstoque,
  saveEstoque,
  getHistorico,
  saveHistorico,
  getUser,
  saveUser,
  clearUser,
  getReceitas,
  saveReceitas,
} from "@/lib/store"
import { LoginForm } from "@/components/login-form"
import { AppSidebar } from "@/components/app-sidebar"
import { EstoqueView } from "@/components/estoque-view"
import { EntradaView } from "@/components/entrada-view"
import { ProducaoView } from "@/components/producao-view"
import { FinanceiroView } from "@/components/financeiro-view"
import { DashboardView } from "@/components/dashboard-view"
import { ListaComprasView } from "@/components/lista-compras-view"

type Tab = "estoque" | "entrada" | "producao" | "financeiro" | "dashboard" | "lista-compras"

export default function Home() {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("estoque")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [itens, setItens] = useState<Item[]>([])
  const [historico, setHistorico] = useState<HistoricoEntry[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])

  // Load data on mount
  useEffect(() => {
    const storedUser = getUser()
    const storedItens = getEstoque()
    const storedHistorico = getHistorico()
    const storedReceitas = getReceitas()

    setUser(storedUser)
    setItens(storedItens)
    setHistorico(storedHistorico)
    setReceitas(storedReceitas)
    setIsLoading(false)
  }, [])

  const handleLogin = (username: string) => {
    saveUser(username)
    setUser(username)
  }

  const handleLogout = () => {
    clearUser()
    setUser(null)
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
    saveEstoque(updated)
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
    saveEstoque(updated)
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
    saveEstoque(updated)
  }

  const handleDeleteItem = (nome: string) => {
    const updated = itens.filter((item) => item.nome !== nome)
    setItens(updated)
    saveEstoque(updated)
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
    saveEstoque(updated)

    // Add to historico
    const entry: HistoricoEntry = {
      nome,
      qtd,
      custo,
      data: new Date().toLocaleDateString("pt-BR"),
    }
    const newHistorico = [...historico, entry]
    setHistorico(newHistorico)
    saveHistorico(newHistorico)
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
    saveEstoque(updated)
  }

  const handleAddReceita = (receita: Receita) => {
    const newReceitas = [...receitas, receita]
    setReceitas(newReceitas)
    saveReceitas(newReceitas)
  }

  const handleUpdateReceita = (receita: Receita) => {
    const updated = receitas.map((r) => (r.id === receita.id ? receita : r))
    setReceitas(updated)
    saveReceitas(updated)
  }

  const handleDeleteReceita = (id: string) => {
    const filtered = receitas.filter((r) => r.id !== id)
    setReceitas(filtered)
    saveReceitas(filtered)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        user={user}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="min-h-screen md:ml-64">
        <div className="p-4 pt-16 md:p-8 md:pt-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {activeTab === "estoque" && "Controle de Estoque"}
              {activeTab === "entrada" && "Entrada de Mercadoria"}
              {activeTab === "producao" && "Produção"}
              {activeTab === "financeiro" && "Financeiro"}
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "lista-compras" && "Lista de Compras"}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === "estoque" &&
                "Gerencie os itens do seu estoque"}
              {activeTab === "entrada" &&
                "Registre novas entradas de mercadoria"}
              {activeTab === "producao" &&
                "Transforme ingredientes em produtos"}
              {activeTab === "financeiro" &&
                "Acompanhe seus gastos e histórico"}
              {activeTab === "dashboard" &&
                "Visualize as métricas do seu negócio"}
              {activeTab === "lista-compras" &&
                "Itens com estoque baixo, quantidades e valor total da compra"}
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
            />
          )}
          {activeTab === "entrada" && (
            <EntradaView itens={itens} onEntrada={handleEntrada} />
          )}
          {activeTab === "producao" && (
            <ProducaoView
              itens={itens}
              receitas={receitas}
              onProduzir={handleProduzir}
              onAddReceita={handleAddReceita}
              onUpdateReceita={handleUpdateReceita}
              onDeleteReceita={handleDeleteReceita}
            />
          )}
          {activeTab === "financeiro" && (
            <FinanceiroView historico={historico} />
          )}
          {activeTab === "dashboard" && (
            <DashboardView itens={itens} historico={historico} />
          )}
          {activeTab === "lista-compras" && (
            <ListaComprasView itens={itens} />
          )}
        </div>
      </main>
    </div>
  )
}

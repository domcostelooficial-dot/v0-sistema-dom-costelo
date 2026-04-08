"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Item, categorias } from "@/lib/types"
import {
  ShoppingCart,
  Search,
  AlertTriangle,
  Check,
  Trash2,
  Calculator,
  TrendingDown,
} from "lucide-react"
import dynamic from "next/dynamic"

const ExportListaComprasPDF = dynamic(
  () => import("./export-lista-compras-pdf").then((mod) => mod.ExportListaComprasPDF),
  { ssr: false, loading: () => <div className="h-10 w-32 animate-pulse rounded-md bg-muted" /> }
)

interface ItemCompra {
  nome: string
  categoria: string
  atual: number
  min: number
  comprar: number
  preco: number
  comprado: boolean
}

interface ListaComprasViewProps {
  itens: Item[]
}

export function ListaComprasView({ itens }: ListaComprasViewProps) {
  const [search, setSearch] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
  const [listaCompras, setListaCompras] = useState<ItemCompra[]>([])
  const [initialized, setInitialized] = useState(false)

  // Initialize lista de compras com itens em falta
  useMemo(() => {
    if (!initialized && itens.length > 0) {
      const itensEmFalta = itens
        .filter((item) => item.atual <= item.min * 1.2)
        .map((item) => ({
          nome: item.nome,
          categoria: item.categoria,
          atual: item.atual,
          min: item.min,
          comprar: Math.max(0, item.min - item.atual + Math.ceil(item.min * 0.2)),
          preco: 0,
          comprado: false,
        }))
      setListaCompras(itensEmFalta)
      setInitialized(true)
    }
  }, [itens, initialized])

  // Atualizar lista quando itens mudam
  useMemo(() => {
    if (initialized) {
      const itensEmFalta = itens.filter((item) => item.atual <= item.min * 1.2)

      setListaCompras((prev) => {
        const updatedList = itensEmFalta.map((item) => {
          const existing = prev.find((p) => p.nome === item.nome)
          return {
            nome: item.nome,
            categoria: item.categoria,
            atual: item.atual,
            min: item.min,
            comprar: Math.max(0, item.min - item.atual + Math.ceil(item.min * 0.2)),
            preco: existing?.preco || 0,
            comprado: existing?.comprado || false,
          }
        })
        return updatedList
      })
    }
  }, [itens, initialized])

  const filteredLista = useMemo(() => {
    return listaCompras.filter((item) => {
      const matchesSearch = item.nome.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoriaFilter === "todas" || item.categoria === categoriaFilter
      return matchesSearch && matchesCategory
    })
  }, [listaCompras, search, categoriaFilter])

  const handlePrecoChange = (nome: string, preco: number) => {
    setListaCompras((prev) =>
      prev.map((item) => (item.nome === nome ? { ...item, preco } : item))
    )
  }

  const handleCompradoChange = (nome: string, comprado: boolean) => {
    setListaCompras((prev) =>
      prev.map((item) => (item.nome === nome ? { ...item, comprado } : item))
    )
  }

  const handleQuantidadeChange = (nome: string, comprar: number) => {
    setListaCompras((prev) =>
      prev.map((item) =>
        item.nome === nome ? { ...item, comprar: Math.max(0, comprar) } : item
      )
    )
  }

  const handleRemoverItem = (nome: string) => {
    setListaCompras((prev) => prev.filter((item) => item.nome !== nome))
  }

  const handleLimparComprados = () => {
    setListaCompras((prev) => prev.filter((item) => !item.comprado))
  }

  const totalGeral = useMemo(() => {
    return listaCompras.reduce((acc, item) => acc + item.preco * item.comprar, 0)
  }, [listaCompras])

  const totalComprados = useMemo(() => {
    return listaCompras
      .filter((item) => item.comprado)
      .reduce((acc, item) => acc + item.preco * item.comprar, 0)
  }, [listaCompras])

  const totalPendentes = useMemo(() => {
    return listaCompras
      .filter((item) => !item.comprado)
      .reduce((acc, item) => acc + item.preco * item.comprar, 0)
  }, [listaCompras])

  const itensComprados = listaCompras.filter((item) => item.comprado).length
  const itensPendentes = listaCompras.filter((item) => !item.comprado).length
  const itensSemPreco = listaCompras.filter((item) => !item.comprado && item.preco === 0).length

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const progressoPercent =
    listaCompras.length > 0
      ? Math.round((itensComprados / listaCompras.length) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Calculadora - Cards de totais em destaque */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Pendente</p>
                  <p className="text-xl font-bold text-warning">
                    {formatCurrency(totalPendentes)}
                  </p>
                  <p className="text-xs text-muted-foreground">{itensPendentes} itens</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Comprado</p>
                  <p className="text-xl font-bold text-success">
                    {formatCurrency(totalComprados)}
                  </p>
                  <p className="text-xs text-muted-foreground">{itensComprados} itens</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-sm font-bold text-primary">R$</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalGeral)}
                  </p>
                  <p className="text-xs text-muted-foreground">{listaCompras.length} itens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          {listaCompras.length > 0 && (
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progresso da compra</span>
                <span>{progressoPercent}% concluido ({itensComprados}/{listaCompras.length})</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all duration-300"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
            </div>
          )}

          {itensSemPreco > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              <span>
                {itensSemPreco} {itensSemPreco === 1 ? "item pendente ainda nao tem" : "itens pendentes ainda nao tem"} valor unitario preenchido. Preencha para calcular o total correto.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold text-foreground">
                  {listaCompras.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">
                  {itensPendentes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comprados</p>
                <p className="text-2xl font-bold text-foreground">
                  {itensComprados}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-lg font-bold text-primary">R$</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Estimado</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalGeral)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Compras */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg text-foreground">Lista de Compras</CardTitle>
          <div className="flex flex-wrap gap-2">
            {itensComprados > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLimparComprados}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Comprados
              </Button>
            )}
            <ExportListaComprasPDF listaCompras={listaCompras} totalGeral={totalGeral} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-input border-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-12"></TableHead>
                  <TableHead className="text-muted-foreground">Item</TableHead>
                  <TableHead className="text-muted-foreground">Categoria</TableHead>
                  <TableHead className="text-muted-foreground text-center">Qtd</TableHead>
                  <TableHead className="text-muted-foreground text-center">
                    <span className="flex items-center justify-center gap-1">
                      Valor Unit. (R$)
                    </span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-center">Subtotal</TableHead>
                  <TableHead className="text-muted-foreground text-center w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="h-8 w-8" />
                        <p>Nenhum item na lista de compras</p>
                        <p className="text-sm">Todos os itens estao com estoque adequado!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLista.map((item) => (
                    <TableRow
                      key={item.nome}
                      className={`border-border transition-colors ${
                        item.comprado 
                          ? "bg-success/10 border-success/30" 
                          : ""
                      }`}
                    >
                      <TableCell>
                        <Button
                          variant={item.comprado ? "default" : "outline"}
                          size="icon"
                          onClick={() => handleCompradoChange(item.nome, !item.comprado)}
                          className={
                            item.comprado
                              ? "bg-success hover:bg-success/90 text-white border-success"
                              : "hover:bg-success/10 hover:border-success/50"
                          }
                        >
                          <Check className={`h-4 w-4 ${item.comprado ? "" : "opacity-40"}`} />
                        </Button>
                      </TableCell>
                      <TableCell
                        className={`font-medium text-foreground ${
                          item.comprado ? "line-through" : ""
                        }`}
                      >
                        {item.nome}
                        {item.atual < item.min && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Critico
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.categoria}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          value={item.comprar}
                          onChange={(e) =>
                            handleQuantidadeChange(item.nome, parseInt(e.target.value) || 0)
                          }
                          className="w-20 mx-auto text-center bg-input border-border"
                          min={0}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="relative mx-auto w-28">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            R$
                          </span>
                          <Input
                            type="number"
                            value={item.preco || ""}
                            onChange={(e) =>
                              handlePrecoChange(item.nome, parseFloat(e.target.value) || 0)
                            }
                            placeholder="0,00"
                            className={`pl-8 text-right bg-input border-border ${
                              !item.comprado && item.preco === 0
                                ? "border-warning/50 focus-visible:ring-warning/30"
                                : ""
                            }`}
                            min={0}
                            step={0.01}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-semibold ${
                            item.preco > 0 ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {item.preco > 0
                            ? formatCurrency(item.preco * item.comprar)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverItem(item.nome)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  FileDown,
  Trash2,
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
        // Manter preços e status de comprado já preenchidos
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
      prev.map((item) =>
        item.nome === nome ? { ...item, preco } : item
      )
    )
  }

  const handleCompradoChange = (nome: string, comprado: boolean) => {
    setListaCompras((prev) =>
      prev.map((item) =>
        item.nome === nome ? { ...item, comprado } : item
      )
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div className="space-y-6">
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
                  <TableHead className="text-muted-foreground text-center">Preco Unit.</TableHead>
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
                      className={`border-border ${item.comprado ? "opacity-50" : ""}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={item.comprado}
                          onCheckedChange={(checked) =>
                            handleCompradoChange(item.nome, checked as boolean)
                          }
                        />
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
                        <Input
                          type="number"
                          value={item.preco || ""}
                          onChange={(e) =>
                            handlePrecoChange(item.nome, parseFloat(e.target.value) || 0)
                          }
                          placeholder="0,00"
                          className="w-24 mx-auto text-center bg-input border-border"
                          min={0}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium text-foreground">
                        {formatCurrency(item.preco * item.comprar)}
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

          {/* Totais */}
          {listaCompras.length > 0 && (
            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex justify-between sm:flex-col sm:items-center">
                  <span className="text-sm text-muted-foreground">Total Pendente</span>
                  <span className="text-lg font-bold text-warning">
                    {formatCurrency(totalPendentes)}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:items-center">
                  <span className="text-sm text-muted-foreground">Total Comprado</span>
                  <span className="text-lg font-bold text-success">
                    {formatCurrency(totalComprados)}
                  </span>
                </div>
                <div className="flex justify-between sm:flex-col sm:items-center border-t pt-4 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4">
                  <span className="text-sm text-muted-foreground">Total Geral</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalGeral)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { Item, categorias } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  Package,
  Search,
  Minus,
  Plus,
  FileDown,
} from "lucide-react"

interface EstoqueViewProps {
  itens: Item[]
  onUpdateItem: (nome: string, novoAtual: number) => void
}

export function EstoqueView({ itens, onUpdateItem }: EstoqueViewProps) {
  const [search, setSearch] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")

  const filteredItens = useMemo(() => {
    return itens.filter((item) => {
      const matchSearch = item.nome
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchCategoria =
        categoriaFilter === "todas" || item.categoria === categoriaFilter
      return matchSearch && matchCategoria
    })
  }, [itens, search, categoriaFilter])

  const stats = useMemo(() => {
    const critical = itens.filter((i) => i.atual < i.min).length
    const low = itens.filter(
      (i) => i.atual >= i.min && i.atual <= i.min * 1.2
    ).length
    const ok = itens.filter((i) => i.atual > i.min * 1.2).length
    return { critical, low, ok, total: itens.length }
  }, [itens])

  const itensEmFalta = useMemo(() => {
    return itens.filter((item) => item.atual <= item.min * 1.2)
  }, [itens])

  const exportarListaComprasPDF = async () => {
    const jsPDF = (await import("jspdf")).default
    const doc = new jsPDF()
    const dataAtual = new Date().toLocaleDateString("pt-BR")
    
    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("DOM COSTELO PRO", 105, 20, { align: "center" })
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("Lista de Compras", 105, 30, { align: "center" })
    
    doc.setFontSize(10)
    doc.text(`Data: ${dataAtual}`, 105, 38, { align: "center" })
    
    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 45, 190, 45)
    
    // Table header
    let yPos = 55
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Item", 20, yPos)
    doc.text("Categoria", 90, yPos)
    doc.text("Atual", 140, yPos)
    doc.text("Min.", 160, yPos)
    doc.text("Comprar", 175, yPos)
    
    doc.setLineWidth(0.3)
    doc.line(20, yPos + 3, 190, yPos + 3)
    
    yPos += 10
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    
    // Group by category
    const porCategoria = itensEmFalta.reduce((acc, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = []
      }
      acc[item.categoria].push(item)
      return acc
    }, {} as Record<string, Item[]>)
    
    Object.entries(porCategoria).forEach(([categoria, items]) => {
      // Check if need new page
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      // Category header
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPos - 5, 170, 8, "F")
      doc.text(categoria.toUpperCase(), 22, yPos)
      yPos += 8
      
      doc.setFont("helvetica", "normal")
      
      items.forEach((item) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        
        const quantidadeComprar = Math.max(0, item.min - item.atual + Math.ceil(item.min * 0.2))
        const isCritical = item.atual < item.min
        
        if (isCritical) {
          doc.setTextColor(180, 0, 0)
        }
        
        doc.text(item.nome, 22, yPos)
        doc.text(item.categoria, 90, yPos)
        doc.text(String(item.atual), 143, yPos)
        doc.text(String(item.min), 163, yPos)
        doc.text(String(quantidadeComprar), 180, yPos)
        
        doc.setTextColor(0, 0, 0)
        yPos += 7
      })
      
      yPos += 3
    })
    
    // Footer
    yPos += 10
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 190, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`Total de itens para comprar: ${itensEmFalta.length}`, 20, yPos)
    
    const criticos = itensEmFalta.filter(i => i.atual < i.min).length
    const baixos = itensEmFalta.filter(i => i.atual >= i.min && i.atual <= i.min * 1.2).length
    
    yPos += 6
    doc.setFont("helvetica", "normal")
    doc.setTextColor(180, 0, 0)
    doc.text(`Itens criticos: ${criticos}`, 20, yPos)
    doc.setTextColor(200, 150, 0)
    doc.text(`Itens com estoque baixo: ${baixos}`, 80, yPos)
    doc.setTextColor(0, 0, 0)
    
    // Save PDF
    doc.save(`lista-compras-${dataAtual.replace(/\//g, "-")}.pdf`)
  }

  const getStatusBadge = (item: Item) => {
    if (item.atual < item.min) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Crítico
        </Badge>
      )
    }
    if (item.atual <= item.min * 1.2) {
      return (
        <Badge className="bg-warning text-warning-foreground gap-1">
          Baixo
        </Badge>
      )
    }
    return (
      <Badge className="bg-success text-success-foreground">
        OK
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Itens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Package className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.low}</p>
                <p className="text-xs text-muted-foreground">Baixo Estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.ok}</p>
                <p className="text-xs text-muted-foreground">Adequados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-foreground">Controle de Estoque</CardTitle>
          <Button
            onClick={exportarListaComprasPDF}
            disabled={itensEmFalta.length === 0}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar Lista de Compras</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="mt-6 rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Item</TableHead>
                  <TableHead className="text-muted-foreground">Categoria</TableHead>
                  <TableHead className="text-muted-foreground text-center">Mínimo</TableHead>
                  <TableHead className="text-muted-foreground text-center">Atual</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItens.map((item) => (
                  <TableRow key={item.nome} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {item.nome}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.categoria}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {item.min}
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {item.atual}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            onUpdateItem(item.nome, Math.max(0, item.atual - 1))
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateItem(item.nome, item.atual + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

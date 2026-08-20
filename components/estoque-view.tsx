"use client"

import { useState, useMemo } from "react"
import { categorias } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Item, MovimentacaoEstoque } from "@/lib/types"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  Package,
  Search,
  PlusCircle,
  Plus,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const ExportPDFButton = dynamic(
  () => import("./export-pdf-button").then((mod) => mod.ExportPDFButton),
  { ssr: false, loading: () => <div className="h-10 w-48 animate-pulse rounded-md bg-muted" /> }
)

interface EstoqueViewProps {
  itens: Item[]
  onEditItem: (oldNome: string, item: Item) => void
  onDeleteItem: (nome: string) => void
  onOpenEntrada?: (item: Item) => void
  onOpenSaida?: (item: Item) => void
  userRole: "admin" | "operador" | "owner"
  movimentacoes?: MovimentacaoEstoque[]
  onEstornarMovimentacao?: (movimentacao: MovimentacaoEstoque) => void
}

export function EstoqueView({ itens, onEditItem, onDeleteItem, onOpenEntrada, onOpenSaida, userRole, movimentacoes = [], onEstornarMovimentacao }: EstoqueViewProps) {
  const isAdmin = userRole === "admin" || userRole === "owner"
  const [search, setSearch] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [movimentacaoParaEstorno, setMovimentacaoParaEstorno] = useState<MovimentacaoEstoque | null>(null)
  const [estornoProcessando, setEstornoProcessando] = useState(false)
  const [historicoBusca, setHistoricoBusca] = useState("")
  const [historicoStatus, setHistoricoStatus] = useState("todos")
  const [historicoTipo, setHistoricoTipo] = useState("todos")
  const [detalheMovimentacao, setDetalheMovimentacao] = useState<MovimentacaoEstoque | null>(null)
  const [historicoDe, setHistoricoDe] = useState("")
  const [historicoAte, setHistoricoAte] = useState("")
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Carnes",
    min: 1,
    atual: 0,
    unidadeEstoque: "Unidade",
    quantidadePorEmbalagem: 1,
    unidadeConteudo: "un",
    precoCompra: 0,
  })

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

  const handleEditItem = () => {
    if (!selectedItem) return
    
    if (!formData.nome.trim()) {
      toast.error("Digite um nome para o item")
      return
    }
    if (formData.min < 0 || formData.atual < 0 || formData.quantidadePorEmbalagem < 0 || formData.precoCompra < 0) {
      toast.error("Os valores numéricos não podem ser negativos")
      return
    }
    if (itens.some((item) => item.nome.toLowerCase() === formData.nome.trim().toLowerCase() && item.nome !== selectedItem.nome)) {
      toast.error("Já existe um item com este nome")
      return
    }

    const updatedItem: Item = {
      ...selectedItem,
      nome: formData.nome.trim(),
      categoria: formData.categoria,
      min: formData.min,
      atual: selectedItem.atual,
      unidadeEstoque: formData.unidadeEstoque,
      quantidadePorEmbalagem: formData.quantidadePorEmbalagem,
      unidadeConteudo: formData.unidadeConteudo,
      precoCompra: formData.precoCompra,
    }

    onEditItem(selectedItem.nome, updatedItem)
    setIsEditDialogOpen(false)
    setSelectedItem(null)
    toast.success(`Item "${updatedItem.nome}" atualizado com sucesso!`)
  }

  const handleDeleteItem = () => {
    if (!isAdmin || !selectedItem) return
    
    onDeleteItem(selectedItem.nome)
    setIsDeleteDialogOpen(false)
    setSelectedItem(null)
    toast.success(`Item "${selectedItem.nome}" removido com sucesso!`)
  }

  const openEditDialog = (item: Item) => {
    setSelectedItem(item)
    setFormData({
      nome: item.nome,
      categoria: item.categoria,
      min: item.min,
      atual: item.atual,
      unidadeEstoque: item.unidadeEstoque ?? "Unidade",
      quantidadePorEmbalagem: item.quantidadePorEmbalagem ?? 1,
      unidadeConteudo: item.unidadeConteudo ?? "un",
      precoCompra: item.precoCompra ?? 0,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: Item) => {
    setSelectedItem(item)
    setIsDeleteDialogOpen(true)
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
          <div className="flex items-center gap-2">
            <ExportPDFButton itensEmFalta={itensEmFalta} />
          </div>
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
                  <TableHead className="text-muted-foreground">Embalagem</TableHead>
                  <TableHead className="text-muted-foreground text-center">Mínimo</TableHead>
                  <TableHead className="text-muted-foreground text-center">Atual</TableHead>
                  <TableHead className="text-muted-foreground text-center">Preço un.</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">Alterado por</TableHead>
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
                    <TableCell className="text-muted-foreground text-xs">
                      {item.quantidadePorEmbalagem ?? 1} {item.unidadeConteudo ?? "un"} / {item.unidadeEstoque ?? "Unidade"}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {item.min}
                    </TableCell>
                    <TableCell className="text-center font-medium text-foreground">
                      {item.atual}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      R$ {(item.precoCompra ?? 0).toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(item)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {item.ultimaAlteracao ? (
                        <div className="text-sm">
                          <span className="font-medium text-foreground capitalize">
                            {item.ultimaAlteracao.usuario}
                          </span>
                          <br />
                          <span className="text-xs">{item.ultimaAlteracao.data}</span>
                        </div>
                      ) : (
                        <span className="text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => onOpenEntrada?.(item)}>Entrada</Button>
                        <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => onOpenSaida?.(item)}>Saída</Button>
                        <Button variant="outline" size="icon" className="size-8" aria-label={`Editar ${item.nome}`} onClick={() => openEditDialog(item)}><Pencil className="h-3 w-3" /></Button>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(item)}
                            aria-label={`Excluir ${item.nome}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Histórico de Movimentações</CardTitle><div className="flex flex-wrap gap-2"><Input className="max-w-xs" placeholder="Buscar insumo, fornecedor ou responsável" value={historicoBusca} onChange={(e) => setHistoricoBusca(e.target.value)} /><Input className="w-36" type="date" aria-label="Data inicial" value={historicoDe} onChange={(e) => setHistoricoDe(e.target.value)} /><Input className="w-36" type="date" aria-label="Data final" value={historicoAte} onChange={(e) => setHistoricoAte(e.target.value)} /><Select value={historicoStatus} onValueChange={setHistoricoStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativa">Ativas</SelectItem><SelectItem value="estornada">Estornadas</SelectItem></SelectContent></Select><Select value={historicoTipo} onValueChange={setHistoricoTipo}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os tipos</SelectItem><SelectItem value="entrada">Entradas</SelectItem><SelectItem value="estorno_entrada">Estornos</SelectItem><SelectItem value="saida">Saídas manuais</SelectItem><SelectItem value="saida_venda">Saídas por venda</SelectItem><SelectItem value="ajuste_inventario">Ajustes de inventário</SelectItem></SelectContent></Select></div></CardHeader><CardContent><div className="space-y-2">{movimentacoes.filter((mov) => { const termo = historicoBusca.toLocaleLowerCase(); const statusOk = historicoStatus === "todos" || (historicoStatus === "ativa" ? mov.status !== "estornada" : mov.status === "estornada"); const tipoOk = historicoTipo === "todos" || mov.tipo === historicoTipo || (historicoTipo === "ajuste_inventario" && mov.tipo === "ajuste"); const data = (mov.dataMovimentacao ?? mov.criadoEm).slice(0, 10); const periodoOk = (!historicoDe || data >= historicoDe) && (!historicoAte || data <= historicoAte); return (mov.tipo === "entrada" || mov.tipo === "saida" || mov.tipo === "estorno_entrada" || mov.tipo === "saida_venda" || mov.tipo === "ajuste" || mov.tipo === "ajuste_inventario") && statusOk && tipoOk && periodoOk && (!termo || `${mov.insumoNomeSnapshot} ${mov.fornecedor ?? ""} ${mov.criadoPorEmail ?? mov.usuarioEmail}`.toLocaleLowerCase().includes(termo)) }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()).map((mov) => <div key={mov.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{mov.tipo === "saida" ? "Saída" : mov.tipo === "estorno_entrada" ? "Estorno" : (mov.tipo === "ajuste" || mov.tipo === "ajuste_inventario") ? "Ajuste de inventário" : "Entrada"} · {mov.insumoNomeSnapshot} · {mov.quantidade > 0 ? "+" : ""}{mov.quantidade} {mov.unidadeSnapshot}</p><p className="text-muted-foreground">{new Date(mov.criadoEm).toLocaleString("pt-BR")} · {mov.usuarioEmail}{mov.fornecedor ? ` · ${mov.fornecedor}` : ""}</p></div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => setDetalheMovimentacao(mov)}>Ver detalhes</Button><Badge variant={mov.status === "estornada" ? "destructive" : "secondary"}>{mov.status === "estornada" ? "Estornada" : "Efetivada"}</Badge>{mov.tipo === "entrada" && (mov.status === "efetivada" || mov.status === "ativa") && (userRole === "admin" || userRole === "owner") && <Button size="sm" variant="outline" onClick={() => setMovimentacaoParaEstorno(mov)}>Estornar</Button>}</div></div>)}{movimentacoes.filter((mov) => mov.tipo === "entrada").length === 0 && <p className="text-sm text-muted-foreground">Nenhuma entrada rastreável registrada.</p>}</div></CardContent></Card>

      <Dialog open={Boolean(detalheMovimentacao)} onOpenChange={(open) => !open && setDetalheMovimentacao(null)}><DialogContent><DialogHeader><DialogTitle>Detalhes da movimentação</DialogTitle><DialogDescription>{detalheMovimentacao && <span className="space-y-1"><span className="block">ID: {detalheMovimentacao.id}</span><span className="block">Tipo: {detalheMovimentacao.tipo === "saida_venda" ? "Saída por venda" : detalheMovimentacao.tipo === "ajuste_inventario" ? "Ajuste de inventário" : detalheMovimentacao.tipo === "estorno_entrada" ? "Estorno de entrada" : detalheMovimentacao.tipo === "entrada" ? "Entrada" : detalheMovimentacao.tipo === "saida" ? "Saída" : detalheMovimentacao.tipo} · Status: {detalheMovimentacao.status}</span><span className="block">Insumo: {detalheMovimentacao.insumoNomeSnapshot} ({detalheMovimentacao.insumoId})</span><span className="block">Quantidade: {detalheMovimentacao.quantidade} {detalheMovimentacao.unidadeSnapshot}</span>{detalheMovimentacao.tipo === "ajuste_inventario" || detalheMovimentacao.tipo === "ajuste" ? <><span className="block">Estoque anterior: {detalheMovimentacao.estoqueAnterior ?? "—"} {detalheMovimentacao.unidadeSnapshot}</span><span className="block">Estoque contado: {detalheMovimentacao.estoqueContado ?? "—"} {detalheMovimentacao.unidadeSnapshot}</span><span className="block">Diferença: {detalheMovimentacao.diferenca != null ? (detalheMovimentacao.diferenca > 0 ? "+" : "") + detalheMovimentacao.diferenca : "—"} {detalheMovimentacao.unidadeSnapshot}</span><span className="block">Motivo: {detalheMovimentacao.motivo ?? "—"}</span><span className="block">Observação: {detalheMovimentacao.observacao ?? "—"}</span></> : detalheMovimentacao.tipo === "saida" ? <><span className="block">Motivo: {detalheMovimentacao.motivo ?? "—"}</span><span className="block">Observação: {detalheMovimentacao.observacao ?? "—"}</span></> : detalheMovimentacao.tipo === "saida_venda" ? <><span className="block">Venda/Pedido: {detalheMovimentacao.vendaId ?? "—"}</span><span className="block">Produto: {detalheMovimentacao.produtoNomeSnapshot ?? "—"} ({detalheMovimentacao.produtoId ?? "—"})</span><span className="block">Quantidade vendida: {detalheMovimentacao.quantidadeVendida ?? "—"}</span><span className="block">Quantidade prevista: {detalheMovimentacao.quantidadeFicha ?? "—"} {detalheMovimentacao.unidadeFicha ?? "—"}</span><span className="block">Quantidade baixada: {Math.abs(detalheMovimentacao.quantidadeBaixadaEstoque ?? detalheMovimentacao.quantidadeBase)} {detalheMovimentacao.unidadeEstoque ?? detalheMovimentacao.unidadeBase ?? "—"}</span><span className="block">Estoque: {detalheMovimentacao.estoqueAnterior ?? "—"} → {detalheMovimentacao.estoquePosterior ?? detalheMovimentacao.saldoPosterior ?? "—"}</span><span className="block">Canal: {detalheMovimentacao.canalVenda ?? "—"}</span><span className="block">Origem: Venda automática</span><span className="block">Baixa: {detalheMovimentacao.baixaId ?? "—"}</span></> : <span className="block">Preço total: R$ {(detalheMovimentacao.precoTotal ?? detalheMovimentacao.valorTotal).toFixed(2)}</span>}<span className="block">Fornecedor: {detalheMovimentacao.fornecedor ?? "—"}</span><span className="block">Data: {new Date(detalheMovimentacao.dataMovimentacao ?? detalheMovimentacao.criadoEm).toLocaleDateString("pt-BR")}</span><span className="block">Criado em: {new Date(detalheMovimentacao.criadoEm).toLocaleString("pt-BR")}</span><span className="block">Responsável: {detalheMovimentacao.criadoPorEmail ?? detalheMovimentacao.usuarioEmail}</span>{detalheMovimentacao.movimentacaoOrigemId && <span className="block">Movimentação original: {detalheMovimentacao.movimentacaoOrigemId}</span>}</span>}</DialogDescription></DialogHeader></DialogContent></Dialog>
      <AlertDialog open={Boolean(movimentacaoParaEstorno)} onOpenChange={(open) => !estornoProcessando && !open && setMovimentacaoParaEstorno(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Estornar entrada?</AlertDialogTitle><AlertDialogDescription>{movimentacaoParaEstorno && <span className="space-y-1"><span className="block">{movimentacaoParaEstorno.insumoNomeSnapshot} · {movimentacaoParaEstorno.quantidade} {movimentacaoParaEstorno.unidadeSnapshot}</span><span className="block">Estoque atual: {itens.find((item) => item.insumoId === movimentacaoParaEstorno.insumoId || item.nome === movimentacaoParaEstorno.insumoNomeSnapshot)?.atual ?? 0}</span><span className="block">Data: {new Date(movimentacaoParaEstorno.dataMovimentacao ?? movimentacaoParaEstorno.criadoEm).toLocaleDateString("pt-BR")}</span><span className="block">Responsável: {movimentacaoParaEstorno.criadoPorEmail ?? movimentacaoParaEstorno.usuarioEmail}</span></span>}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={estornoProcessando}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={estornoProcessando} onClick={async (event) => { event.preventDefault(); if (!movimentacaoParaEstorno || estornoProcessando) return; setEstornoProcessando(true); try { await onEstornarMovimentacao?.(movimentacaoParaEstorno); setMovimentacaoParaEstorno(null) } finally { setEstornoProcessando(false) } }}>{estornoProcessando ? "Estornando..." : "Confirmar estorno"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item do estoque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Item</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Contra filé"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoria: value })
                }
              >
                <SelectTrigger id="edit-categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-unidade">Unidade de estoque</Label>
                <Input id="edit-unidade" value={formData.unidadeEstoque} onChange={(e) => setFormData({ ...formData, unidadeEstoque: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-conteudo">Qtd. embalagem</Label>
                <Input id="edit-conteudo" type="number" min="0" value={formData.quantidadePorEmbalagem} onChange={(e) => setFormData({ ...formData, quantidadePorEmbalagem: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unidade-conteudo">Unidade conteúdo</Label>
                <Input id="edit-unidade-conteudo" value={formData.unidadeConteudo} onChange={(e) => setFormData({ ...formData, unidadeConteudo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-preco">Preço unitário</Label>
              <Input id="edit-preco" type="number" min="0" step="0.01" value={formData.precoCompra} onChange={(e) => setFormData({ ...formData, precoCompra: Number(e.target.value) })} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-min">Estoque Mínimo</Label>
                <Input
                  id="edit-min"
                  type="number"
                  min="0"
                  value={formData.min}
                  onChange={(e) =>
                    setFormData({ ...formData, min: Number(e.target.value) })
                  }
                />
              </div>
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Estoque atual não é cadastral. Corrija o saldo pelo módulo Inventário.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedItem(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => setConfirmEdit(true)}>Confirmar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmEdit} onOpenChange={setConfirmEdit}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar alterações?</AlertDialogTitle><AlertDialogDescription>As alterações de {selectedItem?.nome || "este item"} serão salvas na nuvem.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { setConfirmEdit(false); handleEditItem() }}>Confirmar e salvar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o item{" "}
              <strong>{selectedItem?.nome}</strong> do estoque? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedItem(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

"use client"

import { useState, useMemo } from "react"
import { categorias } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Item } from "@/lib/types"
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
  Minus,
  Plus,
  PlusCircle,
  Edit,
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
  onUpdateItem: (nome: string, novoAtual: number) => void
  onAddItem: (item: Item) => void
  onEditItem: (oldNome: string, item: Item) => void
  onDeleteItem: (nome: string) => void
  userRole: "admin" | "operador"
}

export function EstoqueView({ itens, onUpdateItem, onAddItem, onEditItem, onDeleteItem, userRole }: EstoqueViewProps) {
  const isAdmin = userRole === "admin"
  const [search, setSearch] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("todas")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Carnes",
    min: 1,
    atual: 0,
    unidadeEstoque: "Unidade",
    quantidadePorEmbalagem: 1,
    unidadeConteudo: "un",
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

  const handleAddItem = () => {
    if (!formData.nome.trim()) {
      toast.error("Digite um nome para o item")
      return
    }
    
    if (itens.some((item) => item.nome.toLowerCase() === formData.nome.trim().toLowerCase())) {
      toast.error("Já existe um item com este nome")
      return
    }

    const newItem: Item = {
      nome: formData.nome.trim(),
      categoria: formData.categoria,
      min: formData.min,
      atual: formData.atual,
      unidadeEstoque: formData.unidadeEstoque,
      quantidadePorEmbalagem: formData.quantidadePorEmbalagem,
      unidadeConteudo: formData.unidadeConteudo,
      ultimaAlteracao: undefined,
    }

    onAddItem(newItem)
    setIsAddDialogOpen(false)
    setFormData({ nome: "", categoria: "Carnes", min: 1, atual: 0, unidadeEstoque: "Unidade", quantidadePorEmbalagem: 1, unidadeConteudo: "un" })
    toast.success(`Item "${newItem.nome}" adicionado com sucesso!`)
  }

  const handleEditItem = () => {
    if (!selectedItem) return
    
    if (!formData.nome.trim()) {
      toast.error("Digite um nome para o item")
      return
    }

    const updatedItem: Item = {
      ...selectedItem,
      nome: formData.nome.trim(),
      categoria: formData.categoria,
      min: formData.min,
      atual: formData.atual,
      unidadeEstoque: formData.unidadeEstoque,
      quantidadePorEmbalagem: formData.quantidadePorEmbalagem,
      unidadeConteudo: formData.unidadeConteudo,
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Item</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do novo item do estoque.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-nome">Nome do Item</Label>
                    <Input
                      id="add-nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Contra filé"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) =>
                        setFormData({ ...formData, categoria: value })
                      }
                    >
                      <SelectTrigger id="add-categoria">
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
                      <Label htmlFor="add-unidade">Unidade de estoque</Label>
                      <Input id="add-unidade" value={formData.unidadeEstoque} onChange={(e) => setFormData({ ...formData, unidadeEstoque: e.target.value })} placeholder="Pacote" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-conteudo">Qtd. embalagem</Label>
                      <Input id="add-conteudo" type="number" min="0" value={formData.quantidadePorEmbalagem} onChange={(e) => setFormData({ ...formData, quantidadePorEmbalagem: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-unidade-conteudo">Unidade conteúdo</Label>
                      <Input id="add-unidade-conteudo" value={formData.unidadeConteudo} onChange={(e) => setFormData({ ...formData, unidadeConteudo: e.target.value })} placeholder="kg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-min">Estoque Mínimo</Label>
                      <Input
                        id="add-min"
                        type="number"
                        min="0"
                        value={formData.min}
                        onChange={(e) =>
                          setFormData({ ...formData, min: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-atual">Estoque Atual</Label>
                      <Input
                        id="add-atual"
                        type="number"
                        min="0"
                        value={formData.atual}
                        onChange={(e) =>
                          setFormData({ ...formData, atual: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setFormData({ nome: "", categoria: "Carnes", min: 1, atual: 0, unidadeEstoque: "Unidade", quantidadePorEmbalagem: 1, unidadeConteudo: "un" })
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddItem}>Adicionar Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
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
              <div className="space-y-2">
                <Label htmlFor="edit-atual">Estoque Atual</Label>
                <Input
                  id="edit-atual"
                  type="number"
                  min="0"
                  value={formData.atual}
                  onChange={(e) =>
                    setFormData({ ...formData, atual: Number(e.target.value) })
                  }
                />
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
            <Button onClick={handleEditItem}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

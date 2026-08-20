"use client"

import { useState } from "react"
import { Item, Receita } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  ChefHat,
  ArrowRight,
  Package,
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
} from "lucide-react"

interface ProducaoViewProps {
  itens: Item[]
  receitas: Receita[]
  onProduzir: (receita: Receita) => void
  onAddReceita: (receita: Receita) => void
  onUpdateReceita: (receita: Receita) => void
  onDeleteReceita: (id: string) => void
}

export function ProducaoView({
  itens,
  receitas,
  onProduzir,
  onAddReceita,
  onUpdateReceita,
  onDeleteReceita,
}: ProducaoViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [produzindoId, setProduzindoId] = useState<string | null>(null)
  const [editingReceita, setEditingReceita] = useState<Receita | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    inputItem: "",
    inputQtd: 1,
    outputItem: "",
    outputQtd: 1,
  })

  const itensNomes = itens.map((i) => i.nome)

  const resetForm = () => {
    setFormData({
      nome: "",
      inputItem: "",
      inputQtd: 1,
      outputItem: "",
      outputQtd: 1,
    })
    setEditingReceita(null)
  }

  const handleOpenDialog = (receita?: Receita) => {
    if (receita) {
      setEditingReceita(receita)
      setFormData({
        nome: receita.nome,
        inputItem: receita.inputItem,
        inputQtd: receita.inputQtd,
        outputItem: receita.outputItem,
        outputQtd: receita.outputQtd,
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const handleSubmit = () => {
    if (!formData.nome || !formData.inputItem || !formData.outputItem) return

    if (editingReceita) {
      onUpdateReceita({
        ...editingReceita,
        ...formData,
      })
    } else {
      onAddReceita({
        id: Date.now().toString(),
        ...formData,
      })
    }
    handleCloseDialog()
  }

  const getItemEstoque = (nome: string) => {
    const item = itens.find((i) => i.nome === nome)
    return item?.atual ?? 0
  }

  const canProduce = (receita: Receita) => {
    const estoqueInput = getItemEstoque(receita.inputItem)
    return estoqueInput >= receita.inputQtd
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Receitas de Producao</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie suas receitas de producao
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Receita</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingReceita ? "Editar Receita" : "Nova Receita"}
                </DialogTitle>
                <DialogDescription>
                  {editingReceita
                    ? "Altere os dados da receita de producao"
                    : "Crie uma nova receita definindo os itens de entrada e saida"}
                </DialogDescription>
              </DialogHeader>
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel>Nome da Receita</FieldLabel>
                  <Input
                    placeholder="Ex: Costela Pronta"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Item de Entrada</FieldLabel>
                    <Select
                      value={formData.inputItem}
                      onValueChange={(value) =>
                        setFormData({ ...formData, inputItem: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {itensNomes.map((nome) => (
                          <SelectItem key={nome} value={nome}>
                            {nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Quantidade</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={formData.inputQtd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inputQtd: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Item de Saida</FieldLabel>
                    <Select
                      value={formData.outputItem}
                      onValueChange={(value) =>
                        setFormData({ ...formData, outputItem: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {itensNomes.map((nome) => (
                          <SelectItem key={nome} value={nome}>
                            {nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Quantidade</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={formData.outputQtd}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          outputQtd: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingReceita ? "Salvar" : "Criar Receita"}
                  </Button>
                </div>
              </FieldGroup>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {receitas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma receita cadastrada</p>
              <p className="text-sm text-muted-foreground">
                Clique em &quot;Nova Receita&quot; para adicionar
              </p>
            </div>
          ) : (
            receitas.map((receita) => (
              <div
                key={receita.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    {receita.nome}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(receita)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteReceita(receita.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:justify-center">
                  {/* Input */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted p-4 min-w-48">
                    <Package className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {receita.inputItem}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Usa: <span className="font-semibold">{receita.inputQtd}</span> |
                        Estoque:{" "}
                        <span className="font-semibold">
                          {getItemEstoque(receita.inputItem)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>

                  {/* Output */}
                  <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4 min-w-48">
                    <ChefHat className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        {receita.outputItem}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Produz: <span className="font-semibold">{receita.outputQtd}</span>{" "}
                        | Estoque:{" "}
                        <span className="font-semibold">
                          {getItemEstoque(receita.outputItem)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={async () => {
                      if (produzindoId) return
                      setProduzindoId(receita.id)
                      try {
                        await onProduzir(receita)
                      } finally {
                        setProduzindoId(null)
                      }
                    }}
                    disabled={!canProduce(receita) || produzindoId !== null}
                    className="gap-2"
                  >
                    <PlayCircle className="h-5 w-5" />
                    {produzindoId === receita.id ? "Produzindo..." : "Produzir"}
                  </Button>
                </div>

                {!canProduce(receita) && (
                  <p className="mt-2 text-center text-sm text-destructive">
                    Estoque de {receita.inputItem} insuficiente para producao
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <h4 className="mb-2 font-medium text-foreground">Como funciona:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              - Crie receitas definindo o item de entrada e o item de saida
            </li>
            <li>
              - Configure as quantidades utilizadas e produzidas
            </li>
            <li>
              - Ao produzir, o estoque de entrada e reduzido e o de saida e
              incrementado
            </li>
            <li>- Voce pode editar ou excluir receitas a qualquer momento</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

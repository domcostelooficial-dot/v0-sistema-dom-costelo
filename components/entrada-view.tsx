"use client"

import { useState } from "react"
import { Item, HistoricoEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Truck, Package, Plus } from "lucide-react"

interface EntradaViewProps {
  itens: Item[]
  onEntrada: (nome: string, qtd: number, custo: number, fornecedor?: string, observacao?: string) => void
}

export function EntradaView({ itens, onEntrada }: EntradaViewProps) {
  const [selectedItem, setSelectedItem] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [precoUnitario, setPrecoUnitario] = useState("")
  const [fornecedor, setFornecedor] = useState("")
  const [observacao, setObservacao] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !quantidade) return

    const qtd = Number(quantidade)
    const preco = Number(precoUnitario) || 0
    const custo = qtd * preco

    onEntrada(selectedItem, qtd, custo, fornecedor.trim() || undefined, observacao.trim() || undefined)
    setSelectedItem("")
    setQuantidade("")
    setPrecoUnitario("")
  }

  const selectedItemData = itens.find((i) => i.nome === selectedItem)

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Entrada de Mercadoria</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registre novas entradas no estoque
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel>Item</FieldLabel>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itens.map((item) => (
                      <SelectItem key={item.nome} value={item.nome}>
                        {item.nome} ({item.categoria})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedItemData && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {selectedItemData.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Estoque atual: {selectedItemData.atual} | Mínimo:{" "}
                        {selectedItemData.min}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2"><Field><FieldLabel htmlFor="fornecedor">Fornecedor</FieldLabel><Input id="fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Nome do fornecedor" /></Field><Field><FieldLabel htmlFor="observacao">Observação</FieldLabel><Input id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Nota opcional" /></Field></div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="quantidade">Quantidade</FieldLabel>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    placeholder="Ex: 10"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="preco">Preço Unitário (R$)</FieldLabel>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 25.90"
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                  />
                </Field>
              </div>

              {quantidade && precoUnitario && (
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-foreground">
                    <strong>Custo Total:</strong> R${" "}
                    {(Number(quantidade) * Number(precoUnitario)).toFixed(2)}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!selectedItem || !quantidade}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar ao Estoque
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

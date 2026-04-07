"use client"

import { useMemo } from "react"
import { HistoricoEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign, TrendingUp, Receipt, Calendar } from "lucide-react"

interface FinanceiroViewProps {
  historico: HistoricoEntry[]
}

export function FinanceiroView({ historico }: FinanceiroViewProps) {
  const stats = useMemo(() => {
    const total = historico.reduce((acc, h) => acc + h.custo, 0)
    const count = historico.length
    const avgCost = count > 0 ? total / count : 0
    return { total, count, avgCost }
  }, [historico])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats.total.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Receipt className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.count}</p>
                <p className="text-xs text-muted-foreground">Entradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  R$ {stats.avgCost.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Média por Entrada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Histórico de Compras</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registro de todas as entradas de mercadoria
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhuma entrada registrada ainda
              </p>
              <p className="text-sm text-muted-foreground/70">
                Adicione mercadorias na aba Entrada
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Data</TableHead>
                    <TableHead className="text-muted-foreground">Item</TableHead>
                    <TableHead className="text-muted-foreground text-center">
                      Quantidade
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Custo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...historico].reverse().map((h, index) => (
                    <TableRow key={index} className="border-border">
                      <TableCell className="text-muted-foreground">
                        {h.data}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {h.nome}
                      </TableCell>
                      <TableCell className="text-center text-foreground">
                        {h.qtd}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        R$ {h.custo.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

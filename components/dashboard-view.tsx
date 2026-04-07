"use client"

import { useMemo } from "react"
import { Item, HistoricoEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Package } from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"

interface DashboardViewProps {
  itens: Item[]
  historico: HistoricoEntry[]
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function DashboardView({ itens, historico }: DashboardViewProps) {
  const gastosPorCategoria = useMemo(() => {
    const dados: Record<string, number> = {}

    historico.forEach((h) => {
      const item = itens.find((i) => i.nome === h.nome)
      if (item) {
        if (!dados[item.categoria]) dados[item.categoria] = 0
        dados[item.categoria] += h.custo
      }
    })

    return Object.entries(dados).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }))
  }, [historico, itens])

  const estoqueStats = useMemo(() => {
    const porCategoria: Record<string, { ok: number; baixo: number; critico: number }> = {}

    itens.forEach((item) => {
      if (!porCategoria[item.categoria]) {
        porCategoria[item.categoria] = { ok: 0, baixo: 0, critico: 0 }
      }
      if (item.atual < item.min) {
        porCategoria[item.categoria].critico++
      } else if (item.atual <= item.min * 1.2) {
        porCategoria[item.categoria].baixo++
      } else {
        porCategoria[item.categoria].ok++
      }
    })

    return Object.entries(porCategoria).map(([name, stats]) => ({
      name,
      Ok: stats.ok,
      Baixo: stats.baixo,
      Crítico: stats.critico,
    }))
  }, [itens])

  const totalGasto = useMemo(
    () => historico.reduce((acc, h) => acc + h.custo, 0),
    [historico]
  )

  const itensAbaixoMinimo = useMemo(
    () => itens.filter((i) => i.atual < i.min).length,
    [itens]
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  R$ {totalGasto.toFixed(2)}
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
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{itens.length}</p>
                <p className="text-xs text-muted-foreground">Itens no Estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <Package className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {itensAbaixoMinimo}
                </p>
                <p className="text-xs text-muted-foreground">Abaixo do Mínimo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">
                  {historico.length}
                </p>
                <p className="text-xs text-muted-foreground">Compras Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gastos por Categoria */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-foreground">
                Gastos por Categoria
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {gastosPorCategoria.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">
                  Nenhum gasto registrado ainda
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={gastosPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {gastosPorCategoria.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Valor"]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status do Estoque */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-foreground">
                Status do Estoque por Categoria
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estoqueStats} layout="vertical">
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="Ok" stackId="a" fill="hsl(var(--success))" />
                <Bar dataKey="Baixo" stackId="a" fill="hsl(var(--warning))" />
                <Bar dataKey="Crítico" stackId="a" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

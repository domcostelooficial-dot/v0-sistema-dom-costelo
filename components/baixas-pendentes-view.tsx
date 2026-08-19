"use client"

import type { VendaFinanceira } from "@/lib/finance-engine"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BaixasPendentesView({ vendas, onProcessar }: { vendas: VendaFinanceira[]; onProcessar: (venda: VendaFinanceira) => Promise<void> }) {
  const pendentes = vendas.filter((venda) => venda.statusBaixa !== "baixada" && venda.statusBaixa !== "cancelada")
  return <Card><CardHeader><CardTitle>Pendências de baixa</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{pendentes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma venda pendente de baixa.</p> : pendentes.map((venda) => <div key={venda.id} className="flex items-center justify-between gap-4 rounded-md border p-3"><div><p className="font-medium">{venda.produtoNome}</p><p className="text-sm text-muted-foreground">{venda.quantidade} unidade(s) · {venda.data}</p>{venda.motivoBloqueio && <p className="text-sm text-destructive">{venda.motivoBloqueio}</p>}</div><Button size="sm" onClick={() => onProcessar(venda)}>Processar baixa</Button></div>)}</CardContent></Card>
}

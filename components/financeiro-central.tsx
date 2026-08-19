"use client"

import { useMemo, useState } from "react"
import type { DespesaFinanceira, FinanceConfig, FichaTecnica, Insumo, VendaFinanceira } from "@/lib/types"
import { calcularVenda, defaultFinanceConfig, pontoEquilibrio, projetarMeta, resumoFinanceiro, custoFicha } from "@/lib/finance-engine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Calculator, CircleDollarSign, Plus, Receipt, Target, TrendingUp } from "lucide-react"

interface Props { fichas: FichaTecnica[]; insumos: Insumo[]; vendas?: VendaFinanceira[]; despesas?: DespesaFinanceira[]; config?: FinanceConfig; onAddVenda?: (venda: VendaFinanceira) => void; onAddDespesa?: (despesa: DespesaFinanceira) => void }
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function FinanceiroCentral({ fichas, insumos, vendas = [], despesas = [], config = defaultFinanceConfig, onAddVenda, onAddDespesa }: Props) {
  const [produtoId, setProdutoId] = useState(fichas[0]?.id ?? "")
  const [quantidade, setQuantidade] = useState("1")
  const [canal, setCanal] = useState<"balcao" | "delivery" | "ifood" | "whatsapp" | "outro">("balcao")
  const [despesa, setDespesa] = useState({ descricao: "", categoria: "Operacional", valor: "" })
  const resumo = useMemo(() => resumoFinanceiro(vendas, despesas), [vendas, despesas])
  const produto = fichas.find((ficha) => ficha.id === produtoId)
  const cmv = produto ? custoFicha(produto, insumos) : 0
  const equilibrio = pontoEquilibrio(config.custosFixosMensais, resumo.margemPercentual, config.ticketMedio)
  const projecao = projetarMeta(config.metaFaturamentoMensal, config.diasOperacaoMes, new Date().getDate(), resumo.faturamentoBruto)

  function registrarVenda() {
    if (!produto || !onAddVenda) return
    const venda = calcularVenda({ id: crypto.randomUUID(), data: new Date().toISOString(), canal, produtoId: produto.id, produtoNome: produto.nome, quantidade: Math.max(1, Number(quantidade) || 1), precoUnitario: produto.precoVenda, cmvUnitario: cmv }, config)
    onAddVenda(venda)
  }
  function registrarDespesa() {
    if (!onAddDespesa || !despesa.descricao || Number(despesa.valor) <= 0) return
    onAddDespesa({ id: crypto.randomUUID(), data: new Date().toISOString(), categoria: despesa.categoria, descricao: despesa.descricao, valor: Number(despesa.valor), recorrente: false })
    setDespesa({ descricao: "", categoria: "Operacional", valor: "" })
  }

  const cards = [{ label: "Faturamento bruto", value: money(resumo.faturamentoBruto), icon: CircleDollarSign }, { label: "CMV", value: money(resumo.cmv), icon: Receipt }, { label: "Margem de contribuição", value: money(resumo.margemContribuicao), icon: TrendingUp }, { label: "Lucro operacional", value: money(resumo.lucroOperacional), icon: BarChart3 }]
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label} className="border-border"><CardContent className="flex items-center gap-3 pt-6"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-5" /></div><div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>)}</div>
    <Tabs defaultValue="lancar" className="space-y-4"><TabsList><TabsTrigger value="lancar">Lançar movimento</TabsTrigger><TabsTrigger value="dre">DRE gerencial</TabsTrigger><TabsTrigger value="metas">Metas e equilíbrio</TabsTrigger></TabsList>
      <TabsContent value="lancar" className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" /> Registrar venda</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label>Produto</Label><Select value={produtoId} onValueChange={setProdutoId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{fichas.map((ficha) => <SelectItem key={ficha.id} value={ficha.id}>{ficha.nome} — {money(ficha.precoVenda)}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Quantidade</Label><Input type="number" min="1" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} /></div><div className="grid gap-2"><Label>Canal</Label><Select value={canal} onValueChange={(value) => setCanal(value as typeof canal)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["balcao", "Balcão"], ["delivery", "Delivery"], ["ifood", "iFood"], ["whatsapp", "WhatsApp"], ["outro", "Outro"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div><div className="rounded-lg bg-muted p-3 text-sm">CMV estimado: <strong>{money(cmv)}</strong> por unidade</div><Button onClick={registrarVenda} className="w-full">Adicionar venda</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="size-4 text-primary" /> Registrar despesa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><Label>Descrição</Label><Input value={despesa.descricao} onChange={(event) => setDespesa({ ...despesa, descricao: event.target.value })} placeholder="Ex.: aluguel, energia, marketing" /></div><div className="grid grid-cols-2 gap-3"><div className="grid gap-2"><Label>Categoria</Label><Input value={despesa.categoria} onChange={(event) => setDespesa({ ...despesa, categoria: event.target.value })} /></div><div className="grid gap-2"><Label>Valor</Label><Input type="number" min="0" step="0.01" value={despesa.valor} onChange={(event) => setDespesa({ ...despesa, valor: event.target.value })} /></div></div><Button variant="outline" onClick={registrarDespesa} className="w-full">Adicionar despesa</Button></CardContent></Card>
      </TabsContent>
      <TabsContent value="dre"><Card><CardHeader><CardTitle>DRE gerencial do período</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{[["Faturamento bruto", resumo.faturamentoBruto], ["(-) Taxas de canal", -resumo.taxas], ["Receita líquida", resumo.faturamentoLiquido], ["(-) CMV", -resumo.cmv], ["Margem de contribuição", resumo.margemContribuicao], ["(-) Despesas operacionais", -resumo.despesasOperacionais], ["Resultado operacional", resumo.lucroOperacional]].map(([label, value]) => <div key={label as string} className="flex items-center justify-between border-b border-border py-2"><span>{label}</span><strong className={(value as number) < 0 ? "text-destructive" : "text-foreground"}>{money(value as number)}</strong></div>)}</CardContent></Card></TabsContent>
      <TabsContent value="metas" className="grid gap-4 md:grid-cols-3"><Card><CardContent className="space-y-2 pt-6"><Target className="size-5 text-primary" /><p className="text-sm text-muted-foreground">Atingimento da meta</p><p className="text-2xl font-semibold">{projecao.percentualMeta.toFixed(1)}%</p></CardContent></Card><Card><CardContent className="space-y-2 pt-6"><Calculator className="size-5 text-primary" /><p className="text-sm text-muted-foreground">Ponto de equilíbrio</p><p className="text-2xl font-semibold">{money(equilibrio.faturamento)}</p><p className="text-xs text-muted-foreground">{equilibrio.pedidos} pedidos estimados</p></CardContent></Card><Card><CardContent className="space-y-2 pt-6"><TrendingUp className="size-5 text-primary" /><p className="text-sm text-muted-foreground">Projeção mensal</p><p className="text-2xl font-semibold">{money(projecao.projetado)}</p></CardContent></Card></TabsContent>
    </Tabs>
  </div>
}

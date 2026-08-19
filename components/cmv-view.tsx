"use client"

import { useMemo, useState } from "react"
import { Calculator, Pencil, Plus, Save, Search, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { FichaTecnica, Insumo } from "@/lib/types"
import { alertaCmv, calcularFicha, custoIngrediente, custoPorUnidade, formatBRL, formatPercent } from "@/lib/cmv-engine"

type View = "insumos" | "fichas" | "calculadora"

export function CmvView({ insumos, fichas, onSaveInsumos, onSaveFichas }: { insumos: Insumo[]; fichas: FichaTecnica[]; onSaveInsumos: (data: Insumo[]) => void; onSaveFichas: (data: FichaTecnica[]) => void }) {
  const [view, setView] = useState<View>("insumos")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [price, setPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const filtered = insumos.filter((item) => item.nome.toLowerCase().includes(search.toLowerCase()))
  const selectedFicha = fichas.find((item) => item.id === selected)
  const result = selectedFicha ? calcularFicha({ ...selectedFicha, precoVenda: Number(salePrice) || selectedFicha.precoVenda }, insumos) : null
  const average = fichas.length ? fichas.reduce((total, ficha) => total + calcularFicha(ficha, insumos).cmvPercentual, 0) / fichas.length : 0

  function savePrice(item: Insumo) {
    const next = Number(price.replace(",", "."))
    if (!next || next <= 0) return
    onSaveInsumos(insumos.map((current) => current.nome === item.nome ? { ...current, precoCompra: next, custoUnitario: next / Math.max(current.quantidadeEmbalagem, 1), ultimaAtualizacaoPreco: new Date().toISOString() } : current))
    setSelected(null)
    setPrice("")
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-2">
      {(["insumos", "fichas", "calculadora"] as View[]).map((item) => <Button key={item} variant={view === item ? "default" : "outline"} onClick={() => setView(item)}>{item === "insumos" ? "Insumos e Custos" : item === "fichas" ? "Fichas Técnicas" : "Calculadora CMV"}</Button>)}
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">CMV médio do cardápio</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatPercent(average)}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Produtos cadastrados</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fichas.length}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Insumos centralizados</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{insumos.length}</CardContent></Card>
    </div>

    {view === "insumos" && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Insumos e Custos</CardTitle><div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar insumo" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Insumo</th><th className="p-3">Categoria</th><th className="p-3">Preço compra</th><th className="p-3">Embalagem</th><th className="p-3">Custo unitário</th><th className="p-3" /></tr></thead><tbody>{filtered.map((item) => <tr key={item.nome} className="border-b border-border/60"><td className="p-3 font-medium">{item.nome}</td><td className="p-3 text-muted-foreground">{item.categoria}</td><td className="p-3">{formatBRL(item.precoCompra)}</td><td className="p-3">{item.quantidadeEmbalagem} {item.unidadeEmbalagem}</td><td className="p-3 font-semibold">{formatBRL(custoPorUnidade(item))} / {item.unidade}</td><td className="p-3 text-right"><Button variant="ghost" size="icon" aria-label={`Editar ${item.nome}`} onClick={() => { setSelected(item.nome); setPrice(String(item.precoCompra)) }}><Pencil className="h-4 w-4" /></Button></td></tr>)}</tbody></table></div>{selected && <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"><div><Label>Novo preço para {selected}</Label><Input className="mt-1 w-44" value={price} onChange={(e) => setPrice(e.target.value)} /></div><Button onClick={() => savePrice(insumos.find((item) => item.nome === selected)!)}><Save className="mr-2 h-4 w-4" />Salvar novo custo</Button><Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button></div>}</CardContent></Card>}

    {view === "fichas" && <Card><CardHeader><CardTitle>Fichas Técnicas</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{fichas.map((ficha) => { const data = calcularFicha(ficha, insumos); const status = alertaCmv(data.cmvPercentual); return <Card key={ficha.id} className="border-border/70"><CardHeader className="flex-row items-start justify-between"><div><CardTitle className="text-lg">{ficha.nome}</CardTitle><p className="text-sm text-muted-foreground">{ficha.ingredientes.length} ingredientes</p></div><Badge variant={status.tone === "success" ? "default" : "outline"}>{status.label} · {formatPercent(data.cmvPercentual)}</Badge></CardHeader><CardContent className="space-y-3"><div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">CMV atual</p><p className="text-2xl font-bold">{formatBRL(data.cmv)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Margem bruta</p><p className="font-semibold">{formatBRL(data.margem)}</p></div></div><div className="space-y-1 text-sm">{ficha.ingredientes.map((ingredient) => <div key={`${ficha.id}-${ingredient.insumoNome}`} className="flex justify-between"><span>{ingredient.quantidade} {ingredient.unidade} · {ingredient.insumoNome}</span><span>{formatBRL((calcularFicha(ficha, insumos).ingredientes / Math.max(ficha.ingredientes.length, 1)))}</span></div>)}</div><Button variant="outline" className="w-full" onClick={() => { setSelected(ficha.id); setSalePrice(String(ficha.precoVenda || "")) }}>Ver ficha técnica completa</Button></CardContent></Card> })}</CardContent></Card>}

    {view === "fichas" && selectedFicha && <Card className="border-primary/30 shadow-sm"><CardHeader className="flex-row items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ficha técnica detalhada</p><CardTitle className="mt-1 text-2xl">{selectedFicha.nome}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Custos calculados automaticamente a partir dos insumos centrais</p></div><Button variant="ghost" onClick={() => setSelected(null)}>Fechar</Button></CardHeader><CardContent className="space-y-5"><div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30 text-left text-muted-foreground"><th className="p-3">Ingrediente</th><th className="p-3 text-right">Quantidade</th><th className="p-3">Unidade</th><th className="p-3 text-right">Custo unitário</th><th className="p-3 text-right">Custo na receita</th></tr></thead><tbody>{selectedFicha.ingredientes.map((ingredient) => { const insumo = insumos.find((item) => item.nome.toLowerCase() === ingredient.insumoNome.toLowerCase()); const unit = insumo ? custoPorUnidade(insumo) : 0; const total = custoIngrediente(ingredient, insumos); return <tr key={`${selectedFicha.id}-${ingredient.insumoNome}`} className="border-b border-border/60 last:border-0"><td className="p-3 font-medium">{ingredient.insumoNome}</td><td className="p-3 text-right">{ingredient.quantidade.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</td><td className="p-3">{ingredient.unidade}</td><td className="p-3 text-right">{formatBRL(unit)} / {insumo?.unidadeEmbalagem || ingredient.unidade}</td><td className="p-3 text-right font-semibold">{formatBRL(total)}</td></tr> })}</tbody></table></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Custo dos ingredientes" value={formatBRL(calculateDetail(selectedFicha, insumos).ingredientes)} /><Metric label="CMV total" value={formatBRL(calculateDetail(selectedFicha, insumos).cmv)} /><Metric label="CMV %" value={formatPercent(calculateDetail(selectedFicha, insumos).cmvPercentual)} /><Metric label="Margem bruta" value={formatBRL(calculateDetail(selectedFicha, insumos).margem)} /></div><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 p-4"><div><p className="text-xs text-muted-foreground">Preço de venda</p><p className="text-xl font-bold">{selectedFicha.precoVenda ? formatBRL(selectedFicha.precoVenda) : "Não informado"}</p></div><Button onClick={() => setView("calculadora")}><Calculator className="mr-2 h-4 w-4" />Calcular preço e margem</Button></div></CardContent></Card>}

    {view === "calculadora" && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" />Calculadora de CMV e simulador de preço</CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><div><Label>Produto</Label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selected ?? ""} onChange={(e) => { setSelected(e.target.value); const ficha = fichas.find((item) => item.id === e.target.value); setSalePrice(String(ficha?.precoVenda || "")) }}><option value="">Selecione um produto</option>{fichas.map((ficha) => <option key={ficha.id} value={ficha.id}>{ficha.nome}</option>)}</select></div><div><Label>Preço de venda</Label><Input className="mt-1" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="R$ 0,00" /></div></div>{result && <div className="grid gap-3 sm:grid-cols-4"><Metric label="CMV" value={formatBRL(result.cmv)} /><Metric label="CMV %" value={formatPercent(result.cmvPercentual)} /><Metric label="Margem bruta" value={formatBRL(result.margem)} /><Metric label="Markup" value={`${result.markup.toFixed(2)}x`} /></div>}<div className="rounded-xl border bg-muted/30 p-4"><Label>CMV desejado (%)</Label><div className="mt-2 flex max-w-sm gap-2"><Input id="target" type="number" placeholder="35" /><Button variant="outline" onClick={() => { const target = Number((document.getElementById("target") as HTMLInputElement)?.value); if (target && result) setSalePrice(String((result.cmv / (target / 100)).toFixed(2))) }}>Simular preço</Button></div><p className="mt-2 text-xs text-muted-foreground">Preço sugerido = custo do produto ÷ CMV desejado.</p></div></CardContent></Card>}
  </div>
}

function calculateDetail(ficha: FichaTecnica, insumos: Insumo[]) { return calcularFicha(ficha, insumos) }

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div> }

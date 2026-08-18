"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, ClipboardList, Package, Plus, RefreshCw, ShoppingCart, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FichaTecnica, Insumo, Item, VendaProduto, CompraRegistro, ListaCompraItem, PrevisaoVenda, CategoriaInsumo, UnidadeInsumo } from "@/lib/types"
import { defaultFichasTecnicas, defaultInsumos } from "@/lib/types"

const dinheiro = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const hoje = () => new Date().toISOString().slice(0, 10)
const normalizar = (i: Insumo): Insumo => ({ ...i, custoUnitario: i.precoCompra / Math.max(i.quantidadeEmbalagem, 1) })

interface Props { itens: Item[]; user: string | null; onUpdateEstoque: (nome: string, qtd: number) => void }

export function ListaComprasView({ itens, user, onUpdateEstoque }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>(() => defaultInsumos.map(normalizar))
  const [fichas, setFichas] = useState<FichaTecnica[]>(defaultFichasTecnicas)
  const [vendas, setVendas] = useState<VendaProduto[]>([])
  const [historico, setHistorico] = useState<CompraRegistro[]>([])
  const [previsoes, setPrevisoes] = useState<PrevisaoVenda[]>(defaultFichasTecnicas.map((f) => ({ produtoNome: f.nome, quantidade: 0 })))
  const [inicio, setInicio] = useState(hoje)
  const [fim, setFim] = useState(hoje)
  const [modo, setModo] = useState<"vendas" | "previsao">("vendas")
  const [produto, setProduto] = useState(defaultFichasTecnicas[0]?.nome || "")
  const [qtdVenda, setQtdVenda] = useState("1")
  const [fornecedor, setFornecedor] = useState("")
  const [tab, setTab] = useState("lista")

  const estoquePorNome = useMemo(() => new Map(itens.map((item) => [item.nome, item])), [itens])
  const fichasMap = useMemo(() => new Map(fichas.map((f) => [f.nome, f])), [fichas])
  const vendasConsideradas = modo === "vendas" ? vendas.filter((v) => v.data >= inicio && v.data <= fim) : previsoes.map((p, i) => ({ id: `p-${i}`, produtoNome: p.produtoNome, quantidade: p.quantidade, data: hoje() }))

  const lista = useMemo<ListaCompraItem[]>(() => {
    const consumo = new Map<string, number>()
    vendasConsideradas.forEach((v) => fichasMap.get(v.produtoNome)?.ingredientes.forEach((ingrediente) => consumo.set(ingrediente.insumoNome, (consumo.get(ingrediente.insumoNome) || 0) + ingrediente.quantidade * v.quantidade)))
    return insumos.map((insumo) => {
      const estoque = estoquePorNome.get(insumo.nome)?.atual ?? insumo.atual
      const necessidade = consumo.get(insumo.nome) || 0
      const quantidadeComprar = Math.max(0, necessidade - estoque)
      const embalagens = Math.ceil(quantidadeComprar / Math.max(insumo.quantidadeEmbalagem, 1))
      return { insumoNome: insumo.nome, categoria: insumo.categoria, unidade: insumo.unidade, necessidade, estoque, quantidadeComprar, quantidadeEmbalagem: insumo.quantidadeEmbalagem, embalagens, precoEmbalagem: insumo.precoCompra, valorEstimado: embalagens * insumo.precoCompra }
    }).filter((i) => i.necessidade > 0 || i.estoque <= 0)
  }, [estoquePorNome, fichasMap, insumos, vendasConsideradas])

  const total = lista.reduce((sum, item) => sum + item.valorEstimado, 0)
  const adicionarVenda = () => { if (!produto || Number(qtdVenda) <= 0) return; setVendas((v) => [...v, { id: crypto.randomUUID(), produtoNome: produto, quantidade: Number(qtdVenda), data: hoje() }]); setQtdVenda("1") }
  const marcarCompra = (item: ListaCompraItem) => {
    const real = item.precoEmbalagem
    const registro: CompraRegistro = { id: crypto.randomUUID(), data: hoje(), fornecedor, insumoNome: item.insumoNome, quantidade: item.embalagens * item.quantidadeEmbalagem, unidade: item.unidade, precoUnitario: real, valorTotal: item.valorEstimado, precoAnterior: item.precoEmbalagem, variacao: 0, adicionadaAoEstoque: true }
    setHistorico((h) => [registro, ...h]); onUpdateEstoque(item.insumoNome, registro.quantidade)
  }
  const atualizarPrevisao = (nome: string, quantidade: number) => setPrevisoes((p) => p.map((item) => item.produtoNome === nome ? { ...item, quantidade } : item))
  const atualizarInsumo = (nome: string, patch: Partial<Insumo>) => setInsumos((all) => all.map((item) => item.nome === nome ? normalizar({ ...item, ...patch }) : item))

  return <div className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Custo estimado</p><p className="mt-1 text-2xl font-bold text-primary">{dinheiro(total)}</p><p className="text-xs text-muted-foreground">{lista.length} insumos calculados</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Necessidade total</p><p className="mt-1 text-2xl font-bold">{lista.reduce((s, i) => s + i.necessidade, 0).toLocaleString("pt-BR")} un/g</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Itens para comprar</p><p className="mt-1 text-2xl font-bold">{lista.filter((i) => i.embalagens > 0).length}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Compras registradas</p><p className="mt-1 text-2xl font-bold">{historico.length}</p></CardContent></Card>
    </div>

    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-5"><TabsTrigger value="lista">Lista</TabsTrigger><TabsTrigger value="vendas">Vendas</TabsTrigger><TabsTrigger value="previsao">Previsão</TabsTrigger><TabsTrigger value="insumos">Insumos</TabsTrigger><TabsTrigger value="historico">Histórico</TabsTrigger></TabsList>
      <TabsContent value="lista" className="mt-6 flex flex-col gap-4">
        <Card><CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="flex items-center gap-2"><ShoppingCart data-icon="inline-start" /> Gerar Lista de Compras</CardTitle><p className="mt-1 text-sm text-muted-foreground">Consumo das fichas menos estoque disponível, arredondado para embalagem.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-muted-foreground">De<Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label><label className="text-xs text-muted-foreground">Até<Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></label><Select value={modo} onValueChange={(v) => setModo(v as "vendas" | "previsao")}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vendas">Vendas reais</SelectItem><SelectItem value="previsao">Previsão</SelectItem></SelectContent></Select></div></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Insumo</TableHead><TableHead>Categoria</TableHead><TableHead>Necessário</TableHead><TableHead>Estoque</TableHead><TableHead>Comprar</TableHead><TableHead>Embalagens</TableHead><TableHead>Valor</TableHead><TableHead /></TableRow></TableHeader><TableBody>{lista.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground"><ClipboardList className="mx-auto mb-2" />Registre vendas ou informe uma previsão para gerar a lista.</TableCell></TableRow> : lista.map((item) => <TableRow key={item.insumoNome}><TableCell className="font-medium">{item.insumoNome}</TableCell><TableCell><Badge variant="secondary">{item.categoria}</Badge></TableCell><TableCell>{item.necessidade.toLocaleString("pt-BR")} {item.unidade}</TableCell><TableCell>{item.estoque.toLocaleString("pt-BR")} {item.unidade}</TableCell><TableCell className="font-semibold">{item.quantidadeComprar.toLocaleString("pt-BR")} {item.unidade}</TableCell><TableCell>{item.embalagens} × {item.quantidadeEmbalagem} {item.unidade}</TableCell><TableCell className="font-semibold">{dinheiro(item.valorEstimado)}</TableCell><TableCell><Button size="sm" variant="outline" disabled={!item.embalagens} onClick={() => marcarCompra(item)}><Check data-icon="inline-start" />Comprado</Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      </TabsContent>
      <TabsContent value="vendas" className="mt-6 flex flex-col gap-4"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus data-icon="inline-start" /> Registrar vendas</CardTitle></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><label className="min-w-56 text-sm">Produto<Select value={produto} onValueChange={setProduto}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{fichas.map((f) => <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>)}</SelectContent></Select></label><label className="w-28 text-sm">Quantidade<Input type="number" min="1" value={qtdVenda} onChange={(e) => setQtdVenda(e.target.value)} /></label><Button onClick={adicionarVenda}>Adicionar venda</Button></CardContent></Card><Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Quantidade</TableHead></TableRow></TableHeader><TableBody>{vendas.filter((v) => v.data >= inicio && v.data <= fim).map((v) => <TableRow key={v.id}><TableCell>{v.data}</TableCell><TableCell>{v.produtoNome}</TableCell><TableCell>{v.quantidade}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="previsao" className="mt-6"><Card><CardHeader><CardTitle>Planejar próxima semana</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{previsoes.map((p) => <label key={p.produtoNome} className="text-sm">{p.produtoNome}<Input type="number" min="0" value={p.quantidade} onChange={(e) => atualizarPrevisao(p.produtoNome, Number(e.target.value))} /></label>)}</CardContent></Card></TabsContent>
      <TabsContent value="insumos" className="mt-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Package data-icon="inline-start" /> Cadastro de insumos</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Insumo</TableHead><TableHead>Unidade</TableHead><TableHead>Compra</TableHead><TableHead>Embalagem</TableHead><TableHead>Custo por unidade</TableHead><TableHead>Estoque mínimo</TableHead></TableRow></TableHeader><TableBody>{insumos.map((i) => <TableRow key={i.nome}><TableCell className="font-medium">{i.nome}</TableCell><TableCell>{i.unidade}</TableCell><TableCell><Input className="w-24" type="number" value={i.precoCompra} onChange={(e) => atualizarInsumo(i.nome, { precoCompra: Number(e.target.value) })} /></TableCell><TableCell><Input className="w-24" type="number" value={i.quantidadeEmbalagem} onChange={(e) => atualizarInsumo(i.nome, { quantidadeEmbalagem: Number(e.target.value) })} /></TableCell><TableCell>{dinheiro(i.custoUnitario)}/{i.unidade}</TableCell><TableCell><Input className="w-24" type="number" value={i.min} onChange={(e) => atualizarInsumo(i.nome, { min: Number(e.target.value) })} /></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></TabsContent>
      <TabsContent value="historico" className="mt-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp data-icon="inline-start" /> Histórico de compras</CardTitle></CardHeader><CardContent><div className="mb-4 flex items-center gap-2"><Input placeholder="Fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} /><Badge variant="outline">{dinheiro(historico.reduce((s, h) => s + h.valorTotal, 0))} no histórico</Badge></div><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Insumo</TableHead><TableHead>Fornecedor</TableHead><TableHead>Quantidade</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>{historico.map((h) => <TableRow key={h.id}><TableCell>{h.data}</TableCell><TableCell>{h.insumoNome}</TableCell><TableCell>{h.fornecedor || "—"}</TableCell><TableCell>{h.quantidade} {h.unidade}</TableCell><TableCell>{dinheiro(h.valorTotal)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw data-icon="inline-start" /> Dados calculados automaticamente a partir das fichas técnicas e do estoque atual. <AlertTriangle className="ml-2" /> Preços editados nesta tela recalculam o custo unitário e as próximas listas.</div>
  </div>
}

export type { CategoriaInsumo, UnidadeInsumo }

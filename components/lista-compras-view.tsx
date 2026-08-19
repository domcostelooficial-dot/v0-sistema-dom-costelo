"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, History, Package, Pencil, Plus, ShoppingCart, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Item, Insumo, CompraRegistro, CategoriaInsumo, UnidadeInsumo } from "@/lib/types"
import { apenasInsumosCentrais, calcularValorEstoque, catalogoCompletoCompras } from "@/lib/compras-engine"
import { InsumoEditor } from "@/components/insumo-editor"

const dinheiro = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const hoje = () => new Date().toISOString().slice(0, 10)
const normalizar = (i: Insumo): Insumo => ({ ...i, precoReferencia: i.precoReferencia ?? i.precoCompra, unidadeReferencia: i.unidadeCompra ?? i.unidadeReferencia ?? i.unidade, custoUnitario: (i.precoReferencia ?? i.precoCompra) / Math.max(i.quantidadeEmbalagem, 1) })


interface Props {
  itens: Item[]
  user: string | null
  userRole?: string
  fichas?: { ativo?: boolean; ingredientes: { insumoId?: string }[] }[]
  insumos?: Insumo[]
  historico?: CompraRegistro[]
  onSaveInsumos?: (data: Insumo[]) => void
  onSaveHistorico?: (data: CompraRegistro[]) => void
  onUpdateEstoque: (nome: string, qtd: number) => void
}

export function ListaComprasView({ itens, userRole = "operador", fichas = [], insumos: initialInsumos = [], historico: initialHistorico = [], onSaveInsumos, onSaveHistorico, onUpdateEstoque }: Props) {
  const [insumos, setInsumos] = useState(() => catalogoCompletoCompras(itens, initialInsumos))
  const [historico, setHistorico] = useState(initialHistorico)
  useEffect(() => { setInsumos(catalogoCompletoCompras(itens, initialInsumos)) }, [itens, initialInsumos])
  const [tab, setTab] = useState("lista")
  const [categoria, setCategoria] = useState<string>("todas")
  const [fornecedor, setFornecedor] = useState("")
  const [compra, setCompra] = useState({ nome: "", quantidade: "", unitario: "", data: hoje() })
  const [draftInsumo, setDraftInsumo] = useState<Insumo | null>(null)
  const canManage = userRole === "owner" || userRole === "admin"
  const estoque = useMemo(() => new Map(itens.map((item) => [item.nome, item])), [itens])
  const rows = useMemo(() => insumos.map((i) => {
    const atual = estoque.get(i.nome)?.atual ?? i.atual ?? 0
    const minimo = estoque.get(i.nome)?.min ?? i.min ?? 0
    const comprar = Math.max(0, minimo - atual)
    const preco = i.precoReferencia ?? i.precoCompra ?? 0
    return { ...i, atual, minimo, comprar, valorEstoque: calcularValorEstoque(i, atual), valorCompra: calcularValorEstoque(i, comprar) }
  }).filter((i) => categoria === "todas" || i.categoria === categoria), [categoria, estoque, insumos])
  const valorEstoque = rows.reduce((sum, i) => sum + i.valorEstoque, 0)
  const valorCompra = rows.reduce((sum, i) => sum + i.valorCompra, 0)
  const itensComprar = rows.filter((i) => i.comprar > 0)

  const salvarInsumo = (data: Insumo) => { const atualizados = insumos.some((item) => item.id === data.id) ? insumos.map((item) => item.id === data.id ? data : item) : [...insumos, data]; setInsumos(atualizados); onSaveInsumos?.(apenasInsumosCentrais(atualizados)); setDraftInsumo(null) }
  const registrarCompra = () => {
    const item = insumos.find((i) => i.nome === compra.nome && i.naoVinculado !== true)
    const quantidade = Number(compra.quantidade)
    const unitario = Number(compra.unitario)
    if (!item || quantidade <= 0 || unitario <= 0) return
    const anterior = item.precoReferencia ?? item.precoCompra
    const registro: CompraRegistro = { id: crypto.randomUUID(), data: compra.data, fornecedor, insumoNome: item.nome, quantidade, unidade: (item.unidadeReferencia ?? item.unidade) as UnidadeInsumo, precoUnitario: unitario, valorTotal: quantidade * unitario, precoAnterior: anterior, variacao: anterior ? ((unitario - anterior) / anterior) * 100 : 0, adicionadaAoEstoque: true }
    const novoHistorico = [registro, ...historico]
    setHistorico(novoHistorico)
    onSaveHistorico?.(novoHistorico)
    onUpdateEstoque(item.nome, quantidade)
    salvarInsumo({ ...item, precoReferencia: unitario, precoCompra: unitario, ultimaAtualizacaoPreco: compra.data })
    setCompra({ nome: "", quantidade: "", unitario: "", data: hoje() })
  }
  return <div className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[{ label: "Valor total em estoque", value: dinheiro(valorEstoque), note: "capital parado atualmente", icon: Package }, { label: "Valor da compra", value: dinheiro(valorCompra), note: `${itensComprar.length} itens para reposição`, icon: ShoppingCart }, { label: "Valor após reposição", value: dinheiro(valorEstoque + valorCompra), note: "estoque atual + compra planejada", icon: TrendingUp }, { label: "Itens para comprar", value: String(itensComprar.length), note: "abaixo do estoque mínimo", icon: ClipboardList }].map(({ label, value, note, icon: Icon }) => <Card key={label}><CardContent className="flex items-start justify-between gap-3 pt-6"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div><Icon className="text-muted-foreground" aria-hidden="true" /></CardContent></Card>)}
    </div>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:grid-cols-4"><TabsTrigger value="lista">Lista de compras</TabsTrigger><TabsTrigger value="insumos">Produtos e preços</TabsTrigger><TabsTrigger value="compras">Registrar compra</TabsTrigger><TabsTrigger value="historico">Histórico de preços</TabsTrigger></TabsList>
      <TabsContent value="lista" className="mt-6 flex flex-col gap-4"><Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Controle financeiro do estoque</CardTitle><p className="mt-1 text-sm text-muted-foreground">Valores calculados pela quantidade atual, estoque mínimo e preço de referência.</p></div><Select value={categoria} onValueChange={setCategoria}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Categoria" /></SelectTrigger><SelectContent><SelectItem value="todas">Todas categorias</SelectItem>{Array.from(new Set(insumos.map((i) => i.categoria))).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Estoque atual</TableHead><TableHead>Mínimo</TableHead><TableHead>Comprar</TableHead><TableHead>Preço ref.</TableHead><TableHead>Valor em estoque</TableHead><TableHead>Valor da compra</TableHead></TableRow></TableHeader><TableBody>{rows.map((i) => <TableRow key={i.nome}><TableCell className="font-medium">{i.nome}</TableCell><TableCell><Badge variant="secondary">{i.categoria}</Badge></TableCell><TableCell>{i.atual} {i.unidadeCompra ?? i.unidadeReferencia ?? i.unidade}</TableCell><TableCell>{i.minimo}</TableCell><TableCell className={i.comprar > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>{i.comprar} {i.unidadeCompra ?? i.unidadeReferencia ?? i.unidade}</TableCell><TableCell>{dinheiro(i.precoReferencia ?? i.precoCompra)}</TableCell><TableCell>{dinheiro(i.valorEstoque)}</TableCell><TableCell>{dinheiro(i.valorCompra)}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></TabsContent>
      <TabsContent value="insumos" className="mt-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Pencil data-icon="inline-start" /> Preços de referência</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Unidade de compra</TableHead><TableHead>Conteúdo</TableHead><TableHead>Preço de referência</TableHead><TableHead>Estoque mínimo</TableHead><TableHead>Atualizado em</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>{insumos.map((i) => <TableRow key={i.nome}><TableCell className="font-medium"><div>{i.nome}</div>{i.naoVinculado && <Badge variant="destructive" className="mt-1">INSUMO NÃO VINCULADO</Badge>}</TableCell><TableCell>{i.categoria}</TableCell><TableCell>{i.unidadeCompra ?? i.unidadeReferencia ?? i.unidade}</TableCell><TableCell>{i.quantidadeConteudo ?? i.quantidadeEmbalagem ?? 1} {i.unidadeConteudo ?? i.unidade}</TableCell><TableCell>{dinheiro(i.precoReferencia ?? i.precoCompra)}</TableCell><TableCell>{i.min ?? 0}</TableCell><TableCell className="text-sm text-muted-foreground">{i.ultimaAtualizacaoPreco ?? "—"}</TableCell><TableCell><Button variant="outline" size="sm" onClick={() => setDraftInsumo(structuredClone(i))}>Editar</Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>{draftInsumo && <div className="mt-4"><InsumoEditor mode="edit" insumo={draftInsumo} insumos={insumos} fichas={fichas} canManage={canManage} onSave={salvarInsumo} onClose={() => setDraftInsumo(null)} /></div>}</TabsContent>
      <TabsContent value="compras" className="mt-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus data-icon="inline-start" /> Registrar nova compra</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><label className="text-sm lg:col-span-2">Produto<Select value={compra.nome} onValueChange={(nome) => setCompra((c) => ({ ...c, nome }))}><SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger><SelectContent>{apenasInsumosCentrais(insumos).map((i) => <SelectItem key={i.nome} value={i.nome}>{i.nome}</SelectItem>)}</SelectContent></Select></label><label className="text-sm">Quantidade comprada ({insumos.find((i) => i.nome === compra.nome)?.unidadeReferencia ?? "unidade"})<Input type="number" min="0" step="0.01" value={compra.quantidade} onChange={(e) => setCompra((c) => ({ ...c, quantidade: e.target.value }))} /></label><label className="text-sm">Valor unitário<Input type="number" min="0" step="0.01" value={compra.unitario} onChange={(e) => setCompra((c) => ({ ...c, unitario: e.target.value }))} /></label><label className="text-sm">Data<Input type="date" value={compra.data} onChange={(e) => setCompra((c) => ({ ...c, data: e.target.value }))} /></label><label className="text-sm sm:col-span-2">Fornecedor<Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} /></label><Button className="sm:col-span-2 lg:col-span-3" onClick={registrarCompra}>Salvar compra e atualizar estoque</Button></CardContent></Card></TabsContent>
      <TabsContent value="historico" className="mt-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><History data-icon="inline-start" /> Histórico de preços</CardTitle></CardHeader><CardContent><div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Quantidade</TableHead><TableHead>Preço anterior</TableHead><TableHead>Preço pago</TableHead><TableHead>Variação</TableHead></TableRow></TableHeader><TableBody>{historico.map((h) => <TableRow key={h.id}><TableCell>{h.data}</TableCell><TableCell>{h.insumoNome}</TableCell><TableCell>{h.quantidade} {h.unidade}</TableCell><TableCell>{dinheiro(h.precoAnterior)}</TableCell><TableCell>{dinheiro(h.precoUnitario)}</TableCell><TableCell><Badge variant={h.variacao > 0 ? "destructive" : "secondary"}>{h.variacao > 0 ? "+" : ""}{h.variacao.toFixed(2)}%</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></TabsContent>
    </Tabs>
  </div>
}

export type { CategoriaInsumo, UnidadeInsumo }

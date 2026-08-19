"use client"

import { useMemo, useState } from "react"
import type { Item } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type Motivo = "consumo_interno" | "perda" | "descarte" | "vencimento" | "avaria" | "uso_operacional" | "cortesia" | "outro"

export function SaidaEstoqueView({ itens, canRegister, onSaida }: { itens: Item[]; canRegister: boolean; onSaida: (nome: string, quantidade: number, motivo: Motivo, observacao?: string) => Promise<void> }) {
  const [itemNome, setItemNome] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [motivo, setMotivo] = useState<Motivo | "">("")
  const [observacao, setObservacao] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const item = useMemo(() => itens.find((row) => row.nome === itemNome), [itens, itemNome])
  const qtd = Number(quantidade)
  const valido = Boolean(canRegister && item && item.ativo !== false && item.naoVinculado !== true && qtd > 0 && qtd <= (item?.atual ?? 0) && motivo && (motivo !== "outro" || observacao.trim()))
  const confirmar = async () => {
    if (!item || !motivo || !valido || submitting) return
    setSubmitting(true)
    try { await onSaida(item.nome, qtd, motivo, observacao.trim() || undefined); setConfirmOpen(false); setItemNome(""); setQuantidade(""); setMotivo(""); setObservacao("") } finally { setSubmitting(false) }
  }
  return <Card><CardHeader><CardTitle>Registrar saída de estoque</CardTitle></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2"><Label htmlFor="saida-item">Insumo</Label><Select value={itemNome} onValueChange={setItemNome}><SelectTrigger id="saida-item"><SelectValue placeholder="Selecione um insumo" /></SelectTrigger><SelectContent>{itens.filter((row) => row.ativo !== false && row.naoVinculado !== true && row.atual > 0).map((row) => <SelectItem key={row.nome} value={row.nome}>{row.nome} · {row.atual} {row.unidadeEstoque}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-2"><Label htmlFor="saida-qtd">Quantidade</Label><Input id="saida-qtd" type="number" min="0.01" step="0.01" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="saida-motivo">Motivo</Label><Select value={motivo} onValueChange={(value) => setMotivo(value as Motivo)}><SelectTrigger id="saida-motivo"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger><SelectContent><SelectItem value="consumo_interno">Consumo interno</SelectItem><SelectItem value="perda">Perda</SelectItem><SelectItem value="descarte">Descarte</SelectItem><SelectItem value="vencimento">Vencimento</SelectItem><SelectItem value="avaria">Avaria</SelectItem><SelectItem value="uso_operacional">Uso operacional</SelectItem><SelectItem value="cortesia">Cortesia</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent></Select></div><div className="flex flex-col gap-2"><Label htmlFor="saida-observacao">Observação</Label><Textarea id="saida-observacao" value={observacao} onChange={(event) => setObservacao(event.target.value)} placeholder="Detalhe opcional" /></div>{!canRegister && <p className="text-sm text-destructive">Você não tem permissão para registrar saídas.</p>}{item && qtd > item.atual && <p className="text-sm text-destructive">A quantidade excede o estoque disponível.</p>}<Button disabled={!valido || submitting} onClick={() => setConfirmOpen(true)}>Revisar saída</Button><AlertDialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar saída?</AlertDialogTitle><AlertDialogDescription>{item?.nome} · {qtd} {item?.unidadeEstoque} · Motivo: {motivo}. Estoque após saída: {(item?.atual ?? 0) - qtd}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={submitting} onClick={(event) => { event.preventDefault(); void confirmar() }}>{submitting ? "Registrando..." : "Confirmar saída"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>
}

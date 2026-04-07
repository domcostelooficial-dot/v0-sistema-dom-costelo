"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import jsPDF from "jspdf"
import type { Item } from "@/lib/types"

interface ExportPDFButtonProps {
  itensEmFalta: Item[]
}

export function ExportPDFButton({ itensEmFalta }: ExportPDFButtonProps) {
  const exportarListaComprasPDF = () => {
    const doc = new jsPDF()
    const dataAtual = new Date().toLocaleDateString("pt-BR")
    
    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("DOM COSTELO PRO", 105, 20, { align: "center" })
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("Lista de Compras", 105, 30, { align: "center" })
    
    doc.setFontSize(10)
    doc.text(`Data: ${dataAtual}`, 105, 38, { align: "center" })
    
    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 45, 190, 45)
    
    // Table header
    let yPos = 55
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("Item", 20, yPos)
    doc.text("Categoria", 70, yPos)
    doc.text("Atual", 105, yPos)
    doc.text("Min.", 120, yPos)
    doc.text("Comprar", 137, yPos)
    doc.text("Alterado por", 160, yPos)
    
    doc.setLineWidth(0.3)
    doc.line(20, yPos + 3, 190, yPos + 3)
    
    yPos += 10
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    
    // Group by category
    const porCategoria = itensEmFalta.reduce((acc, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = []
      }
      acc[item.categoria].push(item)
      return acc
    }, {} as Record<string, Item[]>)
    
    Object.entries(porCategoria).forEach(([categoria, items]) => {
      // Check if need new page
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      
      // Category header
      doc.setFont("helvetica", "bold")
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPos - 5, 170, 8, "F")
      doc.text(categoria.toUpperCase(), 22, yPos)
      yPos += 8
      
      doc.setFont("helvetica", "normal")
      
      items.forEach((item) => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        
        const quantidadeComprar = Math.max(0, item.min - item.atual + Math.ceil(item.min * 0.2))
        const isCritical = item.atual < item.min
        const alteradoPor = item.ultimaAlteracao?.usuario || "-"
        
        if (isCritical) {
          doc.setTextColor(180, 0, 0)
        }
        
        doc.text(item.nome.substring(0, 25), 22, yPos)
        doc.text(item.categoria, 70, yPos)
        doc.text(String(item.atual), 108, yPos)
        doc.text(String(item.min), 123, yPos)
        doc.text(String(quantidadeComprar), 142, yPos)
        doc.text(alteradoPor.substring(0, 12), 160, yPos)
        
        doc.setTextColor(0, 0, 0)
        yPos += 7
      })
      
      yPos += 3
    })
    
    // Footer
    yPos += 10
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setLineWidth(0.5)
    doc.line(20, yPos, 190, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(`Total de itens para comprar: ${itensEmFalta.length}`, 20, yPos)
    
    const criticos = itensEmFalta.filter(i => i.atual < i.min).length
    const baixos = itensEmFalta.filter(i => i.atual >= i.min && i.atual <= i.min * 1.2).length
    
    yPos += 6
    doc.setFont("helvetica", "normal")
    doc.setTextColor(180, 0, 0)
    doc.text(`Itens criticos: ${criticos}`, 20, yPos)
    doc.setTextColor(200, 150, 0)
    doc.text(`Itens com estoque baixo: ${baixos}`, 80, yPos)
    doc.setTextColor(0, 0, 0)
    
    // Save PDF
    doc.save(`lista-compras-${dataAtual.replace(/\//g, "-")}.pdf`)
  }

  return (
    <Button
      onClick={exportarListaComprasPDF}
      disabled={itensEmFalta.length === 0}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      <span className="hidden sm:inline">Exportar Lista de Compras</span>
      <span className="sm:hidden">Exportar</span>
    </Button>
  )
}

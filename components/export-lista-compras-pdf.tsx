"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import jsPDF from "jspdf"

interface ItemCompra {
  nome: string
  categoria: string
  atual: number
  min: number
  comprar: number
  preco: number
  comprado: boolean
}

interface ExportListaComprasPDFProps {
  listaCompras: ItemCompra[]
  totalGeral: number
}

export function ExportListaComprasPDF({ listaCompras, totalGeral }: ExportListaComprasPDFProps) {
  const exportarPDF = () => {
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
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Item", 20, yPos)
    doc.text("Cat.", 85, yPos)
    doc.text("Qtd", 115, yPos)
    doc.text("Preco", 132, yPos)
    doc.text("Subtotal", 155, yPos)
    doc.text("Status", 180, yPos)

    doc.setLineWidth(0.3)
    doc.line(20, yPos + 3, 190, yPos + 3)

    yPos += 10
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)

    // Group by category
    const porCategoria = listaCompras.reduce((acc, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = []
      }
      acc[item.categoria].push(item)
      return acc
    }, {} as Record<string, ItemCompra[]>)

    const formatCurrency = (value: number) => {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    }

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

        const subtotal = item.preco * item.comprar

        if (item.comprado) {
          doc.setTextColor(100, 100, 100)
        } else if (item.atual < item.min) {
          doc.setTextColor(180, 0, 0)
        }

        doc.text(item.nome.substring(0, 30), 22, yPos)
        doc.text(item.categoria.substring(0, 10), 85, yPos)
        doc.text(String(item.comprar), 118, yPos)
        doc.text(formatCurrency(item.preco), 130, yPos)
        doc.text(formatCurrency(subtotal), 155, yPos)
        doc.text(item.comprado ? "OK" : "Pend.", 182, yPos)

        doc.setTextColor(0, 0, 0)
        yPos += 7
      })

      yPos += 3
    })

    // Footer with totals
    yPos += 10
    if (yPos > 260) {
      doc.addPage()
      yPos = 20
    }

    doc.setLineWidth(0.5)
    doc.line(20, yPos, 190, yPos)

    yPos += 10
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")

    const totalPendentes = listaCompras
      .filter((i) => !i.comprado)
      .reduce((acc, i) => acc + i.preco * i.comprar, 0)

    const totalComprados = listaCompras
      .filter((i) => i.comprado)
      .reduce((acc, i) => acc + i.preco * i.comprar, 0)

    doc.text(`Total de itens: ${listaCompras.length}`, 20, yPos)
    yPos += 7

    doc.setFont("helvetica", "normal")
    doc.setTextColor(200, 150, 0)
    doc.text(`Pendentes: ${formatCurrency(totalPendentes)}`, 20, yPos)
    doc.setTextColor(0, 150, 0)
    doc.text(`Comprados: ${formatCurrency(totalComprados)}`, 80, yPos)
    doc.setTextColor(0, 0, 0)

    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, 20, yPos)

    // Save PDF
    doc.save(`lista-compras-${dataAtual.replace(/\//g, "-")}.pdf`)
  }

  return (
    <Button onClick={exportarPDF} disabled={listaCompras.length === 0} className="gap-2">
      <FileDown className="h-4 w-4" />
      <span className="hidden sm:inline">Exportar PDF</span>
      <span className="sm:hidden">PDF</span>
    </Button>
  )
}

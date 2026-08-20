"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Check, CloudOff, RefreshCw } from "lucide-react"

type SyncStatus = "sincronizado" | "sincronizando" | "erro"

// Indicador discreto que reflete o estado real de gravação do estoque no Firestore.
export function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>("sincronizado")

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "estoque", "global"),
      { includeMetadataChanges: true },
      (snapshot) => {
        setStatus(snapshot.metadata.hasPendingWrites ? "sincronizando" : "sincronizado")
      },
      () => setStatus("erro"),
    )
    return () => unsubscribe()
  }, [])

  const config = {
    sincronizado: { label: "Sincronizado", icon: Check, className: "text-success" },
    sincronizando: { label: "Sincronizando...", icon: RefreshCw, className: "text-warning animate-pulse" },
    erro: { label: "Erro de sincronização", icon: CloudOff, className: "text-destructive" },
  }[status]

  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}
      role="status"
      aria-live="polite"
      title={config.label}
    >
      <Icon className={`h-3.5 w-3.5 ${status === "sincronizando" ? "animate-spin" : ""}`} aria-hidden="true" />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  )
}

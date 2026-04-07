"use client"

import { Item } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChefHat, ArrowRight, Package } from "lucide-react"

interface ProducaoViewProps {
  itens: Item[]
  onProduzir: () => void
}

export function ProducaoView({ itens, onProduzir }: ProducaoViewProps) {
  const costela = itens.find((i) => i.nome === "Costela")
  const costelaDesfiada = itens.find((i) => i.nome === "Costela Desfiada")

  const canProduce = costela && costela.atual > 0

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">Produção</CardTitle>
              <p className="text-sm text-muted-foreground">
                Transforme ingredientes em produtos
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Receita */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Costela Desfiada
            </h3>
            
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center">
              {/* Input */}
              <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                <Package className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Costela Crua</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque: <span className="font-semibold">{costela?.atual ?? 0}</span>
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>

              {/* Output */}
              <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                <ChefHat className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Costela Desfiada</p>
                  <p className="text-sm text-muted-foreground">
                    Estoque: <span className="font-semibold">{costelaDesfiada?.atual ?? 0}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={onProduzir}
                disabled={!canProduce}
                className="min-w-48"
              >
                <ChefHat className="mr-2 h-5 w-5" />
                Produzir Costela Desfiada
              </Button>
            </div>

            {!canProduce && (
              <p className="mt-4 text-center text-sm text-destructive">
                Estoque de costela insuficiente para produção
              </p>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 font-medium text-foreground">Como funciona:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 1 unidade de Costela crua produz 1 unidade de Costela Desfiada</li>
              <li>• O estoque de costela crua é reduzido automaticamente</li>
              <li>• O estoque de costela desfiada é incrementado</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

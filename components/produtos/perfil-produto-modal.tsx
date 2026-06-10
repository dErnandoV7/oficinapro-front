"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tag, Layers, DollarSign, Package, AlertTriangle } from "lucide-react"
import type { Product } from "@/types/productTypes"

type PerfilProdutoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Product | null
  onEditar: (produto: Product) => void
  onExcluir: (produto: Product) => void
}

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 min-w-0">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value}</p>
    </div>
  </div>
)

export const PerfilProdutoModal = ({
  open,
  onOpenChange,
  produto,
  onEditar,
  onExcluir,
}: PerfilProdutoModalProps) => {
  if (!produto) return null

  const estoqueAbaixoMinimo = produto.stock <= produto.minStock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <DialogTitle className="text-xl break-words min-w-0">{produto.name}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline">
                {produto.type === "PRODUCT" ? "Produto" : "Serviço"}
              </Badge>
              <Badge
                variant={produto.isActive ? "default" : "secondary"}
                className={produto.isActive ? "bg-green-600 hover:bg-green-600" : ""}
              >
                {produto.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 min-w-0">
          <div className="space-y-3">
            {produto.category && (
              <InfoRow
                icon={<Tag className="w-4 h-4 text-muted-foreground" />}
                label="Categoria"
                value={produto.category}
              />
            )}
            {produto.description && (
              <InfoRow
                icon={<Layers className="w-4 h-4 text-muted-foreground" />}
                label="Descrição"
                value={produto.description}
              />
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Preços
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Custo</p>
                <p className="font-semibold tabular-nums">{brlFormatter.format(produto.costPrice)}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Venda</p>
                <p className="font-semibold tabular-nums">{brlFormatter.format(produto.sellPrice)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Estoque
            </h4>
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-1">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Quantidade atual</span>
              </div>
              <p className={`text-3xl font-bold ${estoqueAbaixoMinimo ? "text-destructive" : ""}`}>
                {produto.stock}
              </p>
              <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
                <span className="text-muted-foreground">Mínimo</span>
                <span className="font-medium">{produto.minStock}</span>
              </div>
              {estoqueAbaixoMinimo && (
                <div className="mt-2 flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Estoque abaixo do mínimo</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false)
              onExcluir(produto)
            }}
            className="mr-auto"
          >
            Excluir
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onEditar(produto)
            }}
            className="bg-primary hover:bg-primary/90"
          >
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

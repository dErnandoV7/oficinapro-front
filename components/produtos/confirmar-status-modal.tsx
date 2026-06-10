"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Power } from "lucide-react"

type ConfirmarStatusModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nomeItem: string
  ativar: boolean
  onConfirmar: () => void
}

export const ConfirmarStatusModal = ({
  open,
  onOpenChange,
  nomeItem,
  ativar,
  onConfirmar,
}: ConfirmarStatusModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${ativar ? "bg-green-600/10" : "bg-amber-500/10"}`}>
              <Power className={`w-5 h-5 ${ativar ? "text-green-600" : "text-amber-500"}`} />
            </div>
            <DialogTitle>{ativar ? "Ativar item?" : "Desativar item?"}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Tem certeza que deseja {ativar ? "ativar" : "desativar"} <strong>{nomeItem}</strong>?
            {!ativar && " Não será possível adicioná-lo a novas comandas enquanto estiver inativo."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirmar()
              onOpenChange(false)
            }}
            className={ativar ? "bg-green-600 hover:bg-green-600/90" : ""}
            variant={ativar ? "default" : "destructive"}
          >
            {ativar ? "Ativar" : "Desativar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

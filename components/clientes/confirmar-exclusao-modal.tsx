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
import { AlertTriangle } from "lucide-react"

type ConfirmarExclusaoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  nomeCliente: string
  onConfirmar: () => void
}

export const ConfirmarExclusaoModal = ({
  open,
  onOpenChange,
  nomeCliente,
  onConfirmar,
}: ConfirmarExclusaoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle>Excluir cliente?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Tem certeza que deseja excluir <strong>{nomeCliente}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirmar()
              onOpenChange(false)
            }}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

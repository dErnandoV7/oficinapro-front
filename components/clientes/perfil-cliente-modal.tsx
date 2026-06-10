"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, CreditCard, AlertCircle } from "lucide-react"
import { getClientProfile } from "@/services/clientService"
import { formatPhone } from "@/lib/utils"
import type { ClientProfile } from "@/types/clientTypes"
import type { Cliente } from "./novo-cliente-modal"

type PerfilClienteModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  onExcluir: (id: string) => void
}

export const PerfilClienteModal = ({
  open,
  onOpenChange,
  cliente,
  onExcluir,
}: PerfilClienteModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ClientProfile | null>(null)

  useEffect(() => {
    if (!open || !cliente?.id) return

    const clientId = cliente.id
    let cancelled = false

    const loadProfile = async (id: string) => {
      setIsLoading(true)
      setLoadError(null)
      setProfile(null)

      try {
        const res = await getClientProfile(id)
        if (cancelled) return
        setProfile(res.data)
      } catch (err: unknown) {
        if (cancelled) return

        const serverMessage =
          typeof (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message ===
          "string"
            ? ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "")
            : ""

        setLoadError(
          serverMessage.trim() || "Não foi possível carregar o perfil do cliente. Tente novamente.",
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProfile(clientId)

    return () => {
      cancelled = true
    }
  }, [open, cliente?.id])

  const view = useMemo(() => {
    if (!cliente) return null

    const c = profile?.client
    const d = profile?.debtSummary

    // Limite de crédito:
    // - Se já carregou o perfil completo (`profile`), preferimos o `creditLimit` vindo do backend.
    // - Caso contrário, usamos o valor que já veio no objeto `cliente` (lista).
    // - `Number(...)` normaliza string/number e `Number.isFinite` evita NaN/Infinity.
    const limiteCreditoRaw = c ? Number(c.creditLimit ?? 0) : cliente.limiteCredito
    const limiteCredito = Number.isFinite(limiteCreditoRaw) ? limiteCreditoRaw : 0

    // Dívida atual:
    // - Vem do `debtSummary.outstanding` quando o perfil está carregado.
    // - Se ainda não carregou (ou não veio resumo), cai pra 0.
    const dividaAtualRaw = d ? Number(d.outstanding ?? 0) : 0
    const dividaAtual = Number.isFinite(dividaAtualRaw) ? dividaAtualRaw : 0

    // Disponível = quanto ainda dá pra comprar fiado:
    // limite de crédito - dívida atual (pode ficar negativo).
    const disponivel = limiteCredito - dividaAtual

    return {
      id: cliente.id,
      nome: c?.name ?? cliente.nome,
      telefone: c?.phone ?? cliente.telefone,
      endereco: c?.address ?? cliente.endereco,
      status: c ? (c.isActive ? "Ativo" : "Inativo") : cliente.status,
      limiteCredito,
      dividaAtual,
      disponivel,
      debtSummary: d ?? null,
    }
  }, [cliente, profile])

  if (!cliente || !view) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl">{view.nome}</DialogTitle>
            <Badge
              variant={view.status === "Ativo" ? "default" : "secondary"}
              className={view.status === "Ativo" ? "bg-green-600 hover:bg-green-600" : ""}
            >
              {view.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadError && (
            <p className="text-sm text-destructive" role="alert">
              {loadError}
            </p>
          )}

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Dados do cliente
            </h4>

            <div className="space-y-3">
              {view.telefone && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium break-words">{formatPhone(view.telefone)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium break-words">{view.endereco}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary shrink-0">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Limite de crédito</p>
                  <p className="font-medium break-words">
                    {view.limiteCredito > 0
                      ? `R$ ${view.limiteCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "Não definido"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Resumo
            </h4>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">Dívida atual</span>
              </div>
              <p
                className={`text-3xl font-bold ${view.dividaAtual > 0 ? "text-destructive" : "text-green-600"}`}
              >
                R$ {view.dividaAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>

              {view.limiteCredito > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponível</span>
                    <span
                      className={`font-medium ${view.disponivel >= 0 ? "text-green-600" : "text-destructive"}`}
                    >
                      R$ {view.disponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {view.debtSummary && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comandas</span>
                      <span className="font-medium">{view.debtSummary.totalSalesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Em aberto</span>
                      <span className="font-medium">{view.debtSummary.openSalesCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isLoading && (
              <p className="text-sm text-muted-foreground">Carregando perfil...</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={() => onExcluir(view.id)} className="mr-auto">
            Excluir
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

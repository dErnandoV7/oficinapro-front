"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getSale } from "@/services/saleService"
import type { Sale } from "@/types/saleTypes"

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })

const getServerMessage = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    return typeof message === "string" ? message.trim() : ""
}

const resolveClientName = (sale: Sale) =>
    sale.client?.name ?? sale.customName ?? "Avulso"

const resolvePaymentStatus = (sale: Sale) => {
    if (sale.isFullyPaid) return { label: "Pago", className: "bg-green-600 hover:bg-green-600" } as const
    if (sale.amountPaid > 0) return { label: "Pago parcialmente", className: "bg-amber-500 hover:bg-amber-500" } as const
    return { label: "Pendente", className: "" } as const
}

type DetalheComandaModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    saleId: string | null
}

export const DetalheComandaModal = ({ open, onOpenChange, saleId }: DetalheComandaModalProps) => {
    const [sale, setSale] = useState<Sale | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        if (!open || !saleId) return

        setIsLoading(true)
        setLoadError(null)
        setSale(null)

        getSale(saleId)
            .then((res) => setSale(res.data))
            .catch((err) => {
                const msg = getServerMessage(err)
                setLoadError(msg || "Não foi possível carregar os detalhes da comanda.")
            })
            .finally(() => setIsLoading(false))
    }, [open, saleId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Detalhes da Comanda</DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
                )}

                {loadError && (
                    <p className="py-8 text-center text-sm text-destructive">{loadError}</p>
                )}

                {sale && (
                    <div className="space-y-5 py-2">
                        {/* Cliente */}
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</p>
                            <p className="font-medium">{resolveClientName(sale)}</p>
                            {sale.client?.phone && (
                                <p className="text-sm text-muted-foreground">{sale.client.phone}</p>
                            )}
                        </div>

                        {/* Observação */}
                        {sale.description && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observação</p>
                                <p className="text-sm">{sale.description}</p>
                            </div>
                        )}

                        {/* Itens */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Itens</p>
                            <div className="rounded-lg border border-border divide-y divide-border">
                                {sale.items?.map((item) => (
                                    <div key={item.id} className="px-3 py-2.5 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {item.item?.name ?? item.customDesc}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity}x {brlFormatter.format(item.unitPrice)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium tabular-nums shrink-0">
                                            {brlFormatter.format(item.totalPrice)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totais */}
                        <div className="rounded-lg bg-secondary/40 px-4 py-3 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-semibold tabular-nums">
                                    {brlFormatter.format(sale.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Pago</span>
                                <span className="tabular-nums">{brlFormatter.format(sale.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Restante</span>
                                <span className="tabular-nums font-medium">
                                    {brlFormatter.format(sale.totalAmount - sale.amountPaid)}
                                </span>
                            </div>
                        </div>

                        {/* Rodapé: status + data */}
                        <div className="flex items-center justify-between">
                            {(() => {
                                const status = resolvePaymentStatus(sale)
                                return (
                                    <Badge
                                        variant={sale.isFullyPaid || sale.amountPaid > 0 ? "default" : "secondary"}
                                        className={status.className}
                                    >
                                        {status.label}
                                    </Badge>
                                )
                            })()}
                            <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

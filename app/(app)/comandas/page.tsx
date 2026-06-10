"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Eye, MoreHorizontal, Plus, RefreshCw } from "lucide-react"
import { NovaComandaModal } from "@/components/comandas/nova-comanda-modal"
import { DetalheComandaModal } from "@/components/comandas/detalhe-comanda-modal"
import { toast } from "@/hooks/use-toast"
import { listSales } from "@/services/saleService"
import type { Sale } from "@/types/saleTypes"

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
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

const ComandasPage = () => {
    const [comandas, setComandas] = useState<Sale[]>([])
    const [filterStatus, setFilterStatus] = useState("")
    const [filterSort, setFilterSort] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [modalNovaComanda, setModalNovaComanda] = useState(false)
    const [modalDetalhe, setModalDetalhe] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    const loadComandas = async (status: string, sort: string) => {
        setIsLoading(true)
        setLoadError(null)

        const [sortBy, order] = sort ? sort.split("-") : []

        try {
            const res = await listSales({
                ...(status ? { paymentStatus: status as "pendente" | "parcial" | "pago" } : {}),
                ...(sortBy ? {
                    sortBy: sortBy as "createdAt" | "totalAmount" | "status" | "customName" | "client",
                    order: order as "asc" | "desc",
                } : {}),
            })
            if (!isMountedRef.current) return
            setComandas(res.data)
        } catch (err: unknown) {
            if (!isMountedRef.current) return
            const serverMessage = getServerMessage(err)
            setLoadError(serverMessage || "Não foi possível carregar as comandas. Tente novamente.")
            setComandas([])
        } finally {
            if (isMountedRef.current) setIsLoading(false)
        }
    }

    useEffect(() => {
        loadComandas("", "").catch(() => undefined)
    }, [])

    useEffect(() => {
        loadComandas(filterStatus, filterSort).catch(() => undefined)
    }, [filterStatus, filterSort])

    const reloadWithCurrentFilters = () =>
        loadComandas(filterStatus, filterSort).catch(() => undefined)

    const handleVerDetalhes = (saleId: string) => {
        setSelectedSaleId(saleId)
        setModalDetalhe(true)
    }

    const handleComandaSalva = () => {
        toast({ variant: "success", title: "Sucesso", description: "Comanda aberta com sucesso." })
        reloadWithCurrentFilters()
    }

    const itemCount = (comanda: Sale) => comanda._count?.items ?? comanda.items?.length ?? 0

    const itemCountLabel = (comanda: Sale) => {
        const count = itemCount(comanda)
        return count === 1 ? "1 item" : `${count} itens`
    }

    return (
        <div className="mx-auto w-full max-w-7xl">
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <ClipboardList className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Comandas</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {comandas.length} {comandas.length === 1 ? "comanda aberta" : "comandas abertas"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={reloadWithCurrentFilters}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                                Recarregar
                            </Button>
                            <Button
                                onClick={() => setModalNovaComanda(true)}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Comanda
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Status de pagamento</span>
                            <Select
                                value={filterStatus || "all"}
                                onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}
                            >
                                <SelectTrigger className="h-10 w-full sm:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="parcial">Pago parcialmente</SelectItem>
                                    <SelectItem value="pago">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Ordenar por</span>
                            <Select value={filterSort || "default"} onValueChange={(v) => setFilterSort(v === "default" ? "" : v)}>
                                <SelectTrigger className="h-10 w-full sm:w-56">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Mais recentes</SelectItem>
                                    <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
                                    <SelectItem value="totalAmount-desc">Maior valor</SelectItem>
                                    <SelectItem value="totalAmount-asc">Menor valor</SelectItem>
                                    <SelectItem value="status-asc">Status (Pendente → Pago)</SelectItem>
                                    <SelectItem value="status-desc">Status (Pago → Pendente)</SelectItem>
                                    <SelectItem value="customName-asc">Avulso primeiro</SelectItem>
                                    <SelectItem value="customName-desc">Avulso por último</SelectItem>
                                    <SelectItem value="client-asc">Cliente (A-Z)</SelectItem>
                                    <SelectItem value="client-desc">Cliente (Z-A)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                                Carregando...
                            </div>
                        ) : loadError ? (
                            <div className="rounded-lg border border-border py-10 text-center text-destructive">
                                {loadError}
                            </div>
                        ) : comandas.length === 0 ? (
                            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                                Nenhuma comanda encontrada
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border divide-y divide-border">
                                {comandas.map((comanda) => (
                                    <div key={comanda.id} className="p-4 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-medium leading-5 truncate">
                                                    {resolveClientName(comanda)}
                                                </p>
                                                {(() => {
                                                    const status = resolvePaymentStatus(comanda)
                                                    return (
                                                        <Badge
                                                            variant={comanda.isFullyPaid || comanda.amountPaid > 0 ? "default" : "secondary"}
                                                            className={`shrink-0 ${status.className}`}
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    )
                                                })()}
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <button
                                                    type="button"
                                                    onClick={() => handleVerDetalhes(comanda.id)}
                                                    className="text-primary hover:underline text-left"
                                                >
                                                    {itemCountLabel(comanda)}
                                                </button>
                                                <p className="font-medium text-foreground tabular-nums">
                                                    {brlFormatter.format(comanda.totalAmount)}
                                                </p>
                                                <p>{formatDate(comanda.createdAt)}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                    <span className="sr-only">Abrir menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleVerDetalhes(comanda.id)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver detalhes
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop */}
                    <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                                    <TableHead className="font-semibold pl-4">Cliente</TableHead>
                                    <TableHead className="font-semibold pl-4">Avulso</TableHead>
                                    <TableHead className="font-semibold w-32">Itens</TableHead>
                                    <TableHead className="font-semibold text-right w-36">Total</TableHead>
                                    <TableHead className="font-semibold text-center w-36">Status</TableHead>
                                    <TableHead className="font-semibold w-32 hidden lg:table-cell">Data</TableHead>
                                    <TableHead className="font-semibold text-right w-20 pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : loadError ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-destructive">
                                            {loadError}
                                        </TableCell>
                                    </TableRow>
                                ) : comandas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            Nenhuma comanda encontrada
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    comandas.map((comanda) => (
                                        <TableRow key={comanda.id} className="hover:bg-secondary/30">
                                            <TableCell className="font-medium pl-4 truncate">
                                                {resolveClientName(comanda)}
                                            </TableCell>
                                            <TableCell className="font-medium  truncate">
                                                {comanda.customName ? "Sim" : "Não"}
                                            </TableCell>
                                            <TableCell className="w-32">
                                                <button
                                                    type="button"
                                                    onClick={() => handleVerDetalhes(comanda.id)}
                                                    className="text-sm text-primary hover:underline tabular-nums"
                                                >
                                                    {itemCountLabel(comanda)}
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right font-medium tabular-nums w-36">
                                                {brlFormatter.format(comanda.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-center w-36">
                                                {(() => {
                                                    const status = resolvePaymentStatus(comanda)
                                                    return (
                                                        <Badge
                                                            variant={comanda.isFullyPaid || comanda.amountPaid > 0 ? "default" : "secondary"}
                                                            className={status.className}
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    )
                                                })()}
                                            </TableCell>
                                            <TableCell className="w-32 hidden lg:table-cell text-muted-foreground">
                                                {formatDate(comanda.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right pr-4 w-20">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                            <span className="sr-only">Abrir menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleVerDetalhes(comanda.id)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver detalhes
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <NovaComandaModal
                open={modalNovaComanda}
                onOpenChange={setModalNovaComanda}
                onSaved={handleComandaSalva}
            />

            <DetalheComandaModal
                open={modalDetalhe}
                onOpenChange={setModalDetalhe}
                saleId={selectedSaleId}
            />
        </div>
    )
}

export default ComandasPage

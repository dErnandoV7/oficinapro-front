"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Plus, RefreshCw, Wallet, X } from "lucide-react"
import { NovoPagamentoModal } from "@/components/pagamentos/novo-pagamento-modal"
import { DetalheComandaModal } from "@/components/comandas/detalhe-comanda-modal"
import { toast } from "@/hooks/use-toast"
import { listPayments } from "@/services/paymentService"
import { listClients } from "@/services/clientService"
import { formatPhone } from "@/lib/utils"
import type { Payment, ListPaymentsParams } from "@/types/paymentTypes"
import type { Client } from "@/types/clientTypes"

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

const resolvePaymentName = (payment: Payment) =>
    payment.client?.name ?? payment.sale?.client?.name ?? payment.sale?.customName ?? "Avulso"

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR + i)

type PaymentFilters = {
    clientId?: string
    month?: string
    year?: string
    sort?: string
}

const buildServiceParams = (filters: PaymentFilters): ListPaymentsParams => {
    const [sortBy, order] = filters.sort ? filters.sort.split("-") : []
    return {
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.month && { month: Number(filters.month) }),
        ...(filters.year && { year: Number(filters.year) }),
        ...(sortBy && {
            sortBy: sortBy as "createdAt" | "amount" | "client",
            order: order as "asc" | "desc",
        }),
    }
}

const PagamentosPage = () => {
    const [pagamentos, setPagamentos] = useState<Payment[]>([])
    const [allClients, setAllClients] = useState<Client[]>([])
    const [clientSearch, setClientSearch] = useState("")
    const [showClientDropdown, setShowClientDropdown] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [filterMonth, setFilterMonth] = useState("")
    const [filterYear, setFilterYear] = useState("")
    const [filterSort, setFilterSort] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [modalNovoPagamento, setModalNovoPagamento] = useState(false)
    const [modalDetalhe, setModalDetalhe] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

    const isMountedRef = useRef(true)
    const clientDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    useEffect(() => {
        listClients().then((res) => setAllClients(res.data)).catch(() => undefined)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
                setShowClientDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const loadPagamentos = async (filters: PaymentFilters) => {
        setIsLoading(true)
        setLoadError(null)

        try {
            const res = await listPayments(buildServiceParams(filters))
            if (!isMountedRef.current) return
            setPagamentos(res.data)
        } catch (err: unknown) {
            if (!isMountedRef.current) return
            const serverMessage = getServerMessage(err)
            setLoadError(serverMessage || "Não foi possível carregar os pagamentos. Tente novamente.")
            setPagamentos([])
        } finally {
            if (isMountedRef.current) setIsLoading(false)
        }
    }

    useEffect(() => {
        loadPagamentos({
            clientId: selectedClient?.id,
            month: filterMonth || undefined,
            year: filterYear || undefined,
            sort: filterSort || undefined,
        }).catch(() => undefined)
    }, [selectedClient, filterMonth, filterYear, filterSort])

    const reloadWithCurrentFilters = () =>
        loadPagamentos({
            clientId: selectedClient?.id,
            month: filterMonth || undefined,
            year: filterYear || undefined,
            sort: filterSort || undefined,
        }).catch(() => undefined)

    const handlePagamentoSalvo = () => {
        toast({ variant: "success", title: "Sucesso", description: "Pagamento registrado com sucesso." })
        reloadWithCurrentFilters()
    }

    const handleVerComanda = (saleId: string | null) => {
        if (!saleId) return
        setSelectedSaleId(saleId)
        setModalDetalhe(true)
    }

    const filteredClients = allClients.filter((c) => {
        const term = clientSearch.toLowerCase()
        return c.name.toLowerCase().includes(term) || (c.phone ?? "").toLowerCase().includes(term)
    })

    const selectClient = (client: Client) => {
        setSelectedClient(client)
        setClientSearch("")
        setShowClientDropdown(false)
    }

    const clearSelectedClient = () => {
        setSelectedClient(null)
        setClientSearch("")
        setShowClientDropdown(false)
    }

    return (
        <div className="mx-auto w-full max-w-7xl">
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                <Wallet className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Pagamentos</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {pagamentos.length} {pagamentos.length === 1 ? "pagamento registrado" : "pagamentos registrados"}
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
                                onClick={() => setModalNovoPagamento(true)}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Pagamento
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-6">
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground">Cliente</span>
                            <div className="relative" ref={clientDropdownRef}>
                                {selectedClient ? (
                                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-secondary/30">
                                        <span className="flex-1 text-sm font-medium truncate">
                                            {selectedClient.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearSelectedClient}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="Buscar por nome ou telefone..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        onFocus={() => setShowClientDropdown(true)}
                                        className="h-10"
                                        autoComplete="off"
                                    />
                                )}

                                {showClientDropdown && !selectedClient && clientSearch.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
                                        {filteredClients.length === 0 ? (
                                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                                Nenhum cliente encontrado
                                            </p>
                                        ) : (
                                            filteredClients.slice(0, 6).map((client) => (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => selectClient(client)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    <span className="font-medium">{client.name}</span>
                                                    {client.phone && (
                                                        <span className="text-muted-foreground ml-2">{formatPhone(client.phone)}</span>
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Mês</span>
                                <Select value={filterMonth || "all"} onValueChange={(v) => setFilterMonth(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-10 w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os meses</SelectItem>
                                        {MONTHS.map((label, index) => (
                                            <SelectItem key={label} value={String(index + 1)}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Ano</span>
                                <Select value={filterYear || "all"} onValueChange={(v) => setFilterYear(v === "all" ? "" : v)}>
                                    <SelectTrigger className="h-10 w-28">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {YEARS.map((year) => (
                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Ordenar por</span>
                                <Select value={filterSort || "default"} onValueChange={(v) => setFilterSort(v === "default" ? "" : v)}>
                                    <SelectTrigger className="h-10 w-full sm:w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Mais recentes</SelectItem>
                                        <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
                                        <SelectItem value="amount-desc">Maior valor</SelectItem>
                                        <SelectItem value="amount-asc">Menor valor</SelectItem>
                                        <SelectItem value="client-asc">Cliente / Comanda (A-Z)</SelectItem>
                                        <SelectItem value="client-desc">Cliente / Comanda (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                        ) : pagamentos.length === 0 ? (
                            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                                Nenhum pagamento encontrado
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border divide-y divide-border">
                                {pagamentos.map((pagamento) => (
                                    <div key={pagamento.id} className="p-4 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-medium leading-5 truncate">
                                                {resolvePaymentName(pagamento)}
                                            </p>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground tabular-nums">
                                                    {brlFormatter.format(pagamento.amount)}
                                                </p>
                                                <p>{formatDate(pagamento.createdAt)}</p>
                                                {pagamento.saleId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerComanda(pagamento.saleId)}
                                                        className="text-primary hover:underline text-left"
                                                    >
                                                        Ver comanda
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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
                                    <TableHead className="font-semibold pl-4">Cliente / Comanda</TableHead>
                                    <TableHead className="font-semibold text-right w-36">Valor</TableHead>
                                    <TableHead className="font-semibold w-44">Data</TableHead>
                                    <TableHead className="font-semibold text-right w-32 pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : loadError ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-destructive">
                                            {loadError}
                                        </TableCell>
                                    </TableRow>
                                ) : pagamentos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            Nenhum pagamento encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pagamentos.map((pagamento) => (
                                        <TableRow key={pagamento.id} className="hover:bg-secondary/30">
                                            <TableCell className="font-medium pl-4 truncate">
                                                {resolvePaymentName(pagamento)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium tabular-nums w-36">
                                                {brlFormatter.format(pagamento.amount)}
                                            </TableCell>
                                            <TableCell className="w-44 text-muted-foreground">
                                                {formatDate(pagamento.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right pr-4 w-32">
                                                {pagamento.saleId && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleVerComanda(pagamento.saleId)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1.5" />
                                                        Comanda
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <NovoPagamentoModal
                open={modalNovoPagamento}
                onOpenChange={setModalNovoPagamento}
                onSaved={handlePagamentoSalvo}
            />

            <DetalheComandaModal
                open={modalDetalhe}
                onOpenChange={setModalDetalhe}
                saleId={selectedSaleId}
            />
        </div>
    )
}

export default PagamentosPage

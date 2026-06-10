"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { X } from "lucide-react"
import { listSales } from "@/services/saleService"
import { createPayment } from "@/services/paymentService"
import { formatPhone } from "@/lib/utils"
import type { Sale } from "@/types/saleTypes"

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const onlyDigits = (value: string) => value.replace(/\D/g, "")

const formatCentsToBRL = (centsDigits: string) => {
    const digits = onlyDigits(centsDigits)
    if (!digits) return ""
    const cents = Number(digits)
    if (!Number.isFinite(cents)) return ""
    return brlFormatter.format(cents / 100)
}

const getServerMessage = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    return typeof message === "string" ? message.trim() : ""
}

const resolveClientName = (sale: Sale) =>
    sale.client?.name ?? sale.customName ?? "Avulso"

const remainingOf = (sale: Sale) => sale.totalAmount - sale.amountPaid

type NovoPagamentoModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => void
}

const createEmptyForm = () => ({
    search: "",
    showDropdown: false,
    selectedSale: null as Sale | null,
    amount: "",
})

export const NovoPagamentoModal = ({ open, onOpenChange, onSaved }: NovoPagamentoModalProps) => {
    const [form, setForm] = useState(createEmptyForm)
    const [openSales, setOpenSales] = useState<Sale[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        setIsLoadingData(true)
        listSales()
            .then((res) => {
                setOpenSales(res.data.filter((sale) => !sale.isFullyPaid))
            })
            .catch(() => undefined)
            .finally(() => setIsLoadingData(false))
    }, [open])

    useEffect(() => {
        if (!open) {
            setForm(createEmptyForm())
            setSubmitError(null)
        }
    }, [open])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setForm((prev) => ({ ...prev, showDropdown: false }))
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const set = (patch: Partial<ReturnType<typeof createEmptyForm>>) =>
        setForm((prev) => ({ ...prev, ...patch }))

    const filteredSales = openSales.filter((sale) => {
        const term = form.search.toLowerCase()
        const name = resolveClientName(sale).toLowerCase()
        const phone = (sale.client?.phone ?? "").toLowerCase()
        return name.includes(term) || phone.includes(term)
    })

    const selectSale = (sale: Sale) => {
        set({ selectedSale: sale, search: resolveClientName(sale), showDropdown: false, amount: "" })
    }

    const clearSelectedSale = () => {
        set({ selectedSale: null, search: "", showDropdown: false, amount: "" })
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitError(null)

        if (!form.selectedSale) {
            setSubmitError("Selecione uma comanda em aberto.")
            return
        }

        const amount = Number(onlyDigits(form.amount)) / 100
        if (!amount || amount <= 0) {
            setSubmitError("Informe um valor de pagamento válido.")
            return
        }

        const remaining = remainingOf(form.selectedSale)
        if (amount > remaining) {
            setSubmitError(`O valor não pode ser maior que o saldo devedor (${brlFormatter.format(remaining)}).`)
            return
        }

        setIsSubmitting(true)
        try {
            await createPayment({ saleId: form.selectedSale.id, amount })
            onSaved()
            onOpenChange(false)
        } catch (err: unknown) {
            const msg = getServerMessage(err) || "Não foi possível registrar o pagamento. Tente novamente."
            setSubmitError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const remaining = form.selectedSale ? remainingOf(form.selectedSale) : 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Pagamento</DialogTitle>
                    <DialogDescription>Registre o pagamento de uma comanda em aberto.</DialogDescription>
                </DialogHeader>

                {isLoadingData ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Carregando dados...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <FieldGroup className="py-4">
                            <Field>
                                <FieldLabel>Comanda</FieldLabel>
                                <div className="relative" ref={dropdownRef}>
                                    {form.selectedSale ? (
                                        <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-secondary/30">
                                            <span className="flex-1 text-sm font-medium truncate">
                                                {resolveClientName(form.selectedSale)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearSelectedSale}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Input
                                            placeholder="Buscar por cliente, avulso ou telefone..."
                                            value={form.search}
                                            onChange={(e) => set({ search: e.target.value, showDropdown: true })}
                                            onFocus={() => set({ showDropdown: true })}
                                            className="h-10"
                                            autoComplete="off"
                                        />
                                    )}

                                    {form.showDropdown && !form.selectedSale && (
                                        <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
                                            {filteredSales.length === 0 ? (
                                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                                    Nenhuma comanda em aberto encontrada
                                                </p>
                                            ) : (
                                                filteredSales.slice(0, 8).map((sale) => (
                                                    <button
                                                        key={sale.id}
                                                        type="button"
                                                        onClick={() => selectSale(sale)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-3"
                                                    >
                                                        <span className="min-w-0">
                                                            <span className="font-medium block truncate">{resolveClientName(sale)}</span>
                                                            {sale.client?.phone && (
                                                                <span className="text-muted-foreground text-xs block">
                                                                    {formatPhone(sale.client.phone)}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs tabular-nums shrink-0">
                                                            {brlFormatter.format(remainingOf(sale))} restante
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Field>

                            {form.selectedSale && (
                                <div className="rounded-lg bg-secondary/40 px-4 py-3 space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="tabular-nums">{brlFormatter.format(form.selectedSale.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Pago</span>
                                        <span className="tabular-nums">{brlFormatter.format(form.selectedSale.amountPaid)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Restante</span>
                                        <span className="tabular-nums font-medium">{brlFormatter.format(remaining)}</span>
                                    </div>
                                </div>
                            )}

                            <Field>
                                <FieldLabel>Valor do pagamento</FieldLabel>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="R$ 0,00"
                                    value={formatCentsToBRL(form.amount)}
                                    onChange={(e) =>
                                        set({
                                            amount: onlyDigits(e.target.value)
                                                .replace(/^0+(?=\d)/, "")
                                                .slice(0, 12),
                                        })
                                    }
                                    disabled={!form.selectedSale}
                                    className="h-10"
                                />
                            </Field>

                            {submitError && (
                                <p className="text-sm text-destructive" role="alert">
                                    {submitError}
                                </p>
                            )}
                        </FieldGroup>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

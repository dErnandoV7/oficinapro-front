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
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, X } from "lucide-react"
import { listClients } from "@/services/clientService"
import { listProducts } from "@/services/productService"
import { createSale } from "@/services/saleService"
import { formatPhone } from "@/lib/utils"
import type { Client } from "@/types/clientTypes"
import type { Product } from "@/types/productTypes"
import type { SaleFormData } from "@/types/saleTypes"

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

type ComandaItemDraft = {
    key: string
    catalogItemId?: string
    name: string
    customDesc?: string
    quantity: number
    unitPrice: number
}

type AddingMode = "none" | "catalog" | "manual"

type NovaComandaModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => void
}

const createEmptyForm = () => ({
    clientSearch: "",
    selectedClient: null as Client | null,
    showClientDropdown: false,
    customName: "",
    description: "",
    items: [] as ComandaItemDraft[],
    addingMode: "none" as AddingMode,
    catalogSearch: "",
    catalogSelected: null as Product | null,
    catalogQty: "1",
    catalogPriceOverride: "",
    manualDesc: "",
    manualPrice: "",
    manualQty: "1",
})

export const NovaComandaModal = ({ open, onOpenChange, onSaved }: NovaComandaModalProps) => {
    const [form, setForm] = useState(createEmptyForm)
    const [allClients, setAllClients] = useState<Client[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const clientDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        setIsLoadingData(true)
        Promise.all([
            listClients({ isActive: "true" }),
            listProducts({ isActive: "true" }),
        ])
            .then(([clientsRes, productsRes]) => {
                setAllClients(clientsRes.data)
                setAllProducts(productsRes.data)
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
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
                setForm((prev) => ({ ...prev, showClientDropdown: false }))
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filteredClients = allClients.filter((c) => {
        const term = form.clientSearch.toLowerCase()
        return c.name.toLowerCase().includes(term) || (c.phone ?? "").includes(term)
    })

    const filteredProducts = allProducts.filter((p) =>
        p.name.toLowerCase().includes(form.catalogSearch.toLowerCase())
    )

    const totalPreview = form.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)

    const set = (patch: Partial<ReturnType<typeof createEmptyForm>>) =>
        setForm((prev) => ({ ...prev, ...patch }))

    const selectClient = (client: Client) => {
        set({ selectedClient: client, clientSearch: client.name, showClientDropdown: false })
    }

    const clearSelectedClient = () => {
        set({ selectedClient: null, clientSearch: "", showClientDropdown: false })
    }

    const removeItem = (key: string) => {
        setForm((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }))
    }

    const openAddCatalog = () => set({ addingMode: "catalog", catalogSearch: "", catalogSelected: null, catalogQty: "1", catalogPriceOverride: "" })
    const openAddManual = () => set({ addingMode: "manual", manualDesc: "", manualPrice: "", manualQty: "1" })
    const cancelAdding = () => set({ addingMode: "none" })

    const confirmAddCatalogItem = () => {
        const { catalogSelected, catalogQty, catalogPriceOverride } = form
        if (!catalogSelected) return

        const qty = parseInt(catalogQty, 10) || 1
        const priceDigits = onlyDigits(catalogPriceOverride)
        const unitPrice = priceDigits ? Number(priceDigits) / 100 : catalogSelected.sellPrice

        const newItem: ComandaItemDraft = {
            key: crypto.randomUUID(),
            catalogItemId: catalogSelected.id,
            name: catalogSelected.name,
            quantity: qty,
            unitPrice,
        }

        setForm((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
            addingMode: "none",
            catalogSearch: "",
            catalogSelected: null,
            catalogQty: "1",
            catalogPriceOverride: "",
        }))
    }

    const confirmAddManualItem = () => {
        const { manualDesc, manualPrice, manualQty } = form
        if (!manualDesc.trim()) return

        const priceDigits = onlyDigits(manualPrice)
        if (!priceDigits) return

        const qty = parseInt(manualQty, 10) || 1
        const unitPrice = Number(priceDigits) / 100

        const newItem: ComandaItemDraft = {
            key: crypto.randomUUID(),
            customDesc: manualDesc.trim(),
            name: manualDesc.trim(),
            quantity: qty,
            unitPrice,
        }

        setForm((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
            addingMode: "none",
            manualDesc: "",
            manualPrice: "",
            manualQty: "1",
        }))
    }

    const buildPayload = (): SaleFormData => ({
        ...(form.selectedClient ? { clientId: form.selectedClient.id } : {}),
        ...(form.customName.trim() ? { customName: form.customName.trim() } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        items: form.items.map((item) => ({
            ...(item.catalogItemId ? { catalogItemId: item.catalogItemId } : {}),
            ...(item.customDesc ? { customDesc: item.customDesc } : {}),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        })),
    })

    const validateForm = (): string | null => {
        const hasClient = form.selectedClient != null || form.customName.trim().length > 0
        if (!hasClient) return "Informe um cliente cadastrado ou um nome avulso."
        if (form.items.length === 0) return "Adicione pelo menos um item à comanda."
        return null
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSubmitError(null)

        const validationError = validateForm()
        if (validationError) {
            setSubmitError(validationError)
            return
        }

        setIsSubmitting(true)
        try {
            await createSale(buildPayload())
            onSaved()
            onOpenChange(false)
        } catch (err: unknown) {
            const msg = getServerMessage(err) || "Não foi possível abrir a comanda. Tente novamente."
            setSubmitError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const hasClient = form.selectedClient != null || form.customName.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Nova Comanda</DialogTitle>
                    <DialogDescription>Preencha os dados para abrir uma nova comanda.</DialogDescription>
                </DialogHeader>

                {isLoadingData ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Carregando dados...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="overflow-y-auto flex-1 pr-1">
                            <FieldGroup className="py-4">

                                {/* Cliente cadastrado */}
                                <Field>
                                    <FieldLabel>
                                        Cliente cadastrado{" "}
                                        <span className="text-muted-foreground font-normal">(opcional)</span>
                                    </FieldLabel>
                                    <div className="relative" ref={clientDropdownRef}>
                                        {form.selectedClient ? (
                                            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-secondary/30">
                                                <span className="flex-1 text-sm font-medium truncate">
                                                    {form.selectedClient.name}
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
                                                placeholder="Buscar pelo nome ou telefone..."
                                                value={form.clientSearch}
                                                onChange={(e) =>
                                                    set({ clientSearch: e.target.value, showClientDropdown: true })
                                                }
                                                onFocus={() => set({ showClientDropdown: true })}
                                                className="h-10"
                                                autoComplete="off"
                                            />
                                        )}

                                        {form.showClientDropdown && !form.selectedClient && form.clientSearch.length > 0 && (
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
                                </Field>

                                {/* Nome avulso */}
                                <Field>
                                    <FieldLabel>
                                        Nome avulso{" "}
                                        <span className="text-muted-foreground font-normal">(opcional)</span>
                                    </FieldLabel>
                                    <Input
                                        placeholder="Ex: João da padaria"
                                        value={form.customName}
                                        onChange={(e) => set({ customName: e.target.value })}
                                        className="h-10"
                                    />
                                    {!hasClient && (
                                        <p className="text-xs text-muted-foreground">
                                            Informe um cliente cadastrado ou um nome avulso.
                                        </p>
                                    )}
                                </Field>

                                {/* Observação */}
                                <Field>
                                    <FieldLabel>
                                        Observação{" "}
                                        <span className="text-muted-foreground font-normal">(opcional)</span>
                                    </FieldLabel>
                                    <Input
                                        placeholder="Observação geral da comanda..."
                                        value={form.description}
                                        onChange={(e) => set({ description: e.target.value })}
                                        className="h-10"
                                    />
                                </Field>

                                {/* Itens */}
                                <Field>
                                    <FieldLabel>Itens</FieldLabel>

                                    {form.items.length > 0 && (
                                        <div className="rounded-lg border border-border divide-y divide-border mb-3">
                                            {form.items.map((item) => (
                                                <div key={item.key} className="px-3 py-2.5 flex items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.quantity}x {brlFormatter.format(item.unitPrice)}
                                                            {!item.catalogItemId && (
                                                                <Badge variant="outline" className="ml-2 text-xs">Manual</Badge>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm font-medium tabular-nums shrink-0">
                                                        {brlFormatter.format(item.quantity * item.unitPrice)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.key)}
                                                        className="text-muted-foreground hover:text-destructive shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Inline: adicionar do catálogo */}
                                    {form.addingMode === "catalog" && (
                                        <div className="rounded-lg border border-border p-3 space-y-3 mb-3 bg-secondary/20">
                                            <p className="text-sm font-medium">Adicionar do catálogo</p>

                                            {form.catalogSelected ? (
                                                <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/50">
                                                    <span className="flex-1 text-sm font-medium">{form.catalogSelected.name}</span>
                                                    <span className="text-xs text-muted-foreground tabular-nums">
                                                        {brlFormatter.format(form.catalogSelected.sellPrice)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => set({ catalogSelected: null, catalogSearch: "" })}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Input
                                                        placeholder="Buscar produto ou serviço..."
                                                        value={form.catalogSearch}
                                                        onChange={(e) => set({ catalogSearch: e.target.value })}
                                                        className="h-9"
                                                        autoFocus
                                                    />
                                                    {form.catalogSearch.length > 0 && (
                                                        <div className="mt-1 rounded-md border border-border bg-popover shadow-sm max-h-36 overflow-y-auto">
                                                            {filteredProducts.length === 0 ? (
                                                                <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum item encontrado</p>
                                                            ) : (
                                                                filteredProducts.slice(0, 5).map((product) => (
                                                                    <button
                                                                        key={product.id}
                                                                        type="button"
                                                                        onClick={() => set({ catalogSelected: product, catalogSearch: "" })}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-3"
                                                                    >
                                                                        <span className="font-medium truncate">{product.name}</span>
                                                                        <span className="text-muted-foreground text-xs tabular-nums shrink-0">
                                                                            {brlFormatter.format(product.sellPrice)}
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={form.catalogQty}
                                                        onChange={(e) => set({ catalogQty: e.target.value })}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        Preço <span className="text-muted-foreground/70">(opcional)</span>
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder={form.catalogSelected ? brlFormatter.format(form.catalogSelected.sellPrice) : "R$ 0,00"}
                                                        value={formatCentsToBRL(form.catalogPriceOverride)}
                                                        onChange={(e) =>
                                                            set({
                                                                catalogPriceOverride: onlyDigits(e.target.value)
                                                                    .replace(/^0+(?=\d)/, "")
                                                                    .slice(0, 12),
                                                            })
                                                        }
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <Button type="button" variant="outline" size="sm" onClick={cancelAdding}>
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={confirmAddCatalogItem}
                                                    disabled={!form.catalogSelected}
                                                >
                                                    Adicionar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Inline: adicionar item manual */}
                                    {form.addingMode === "manual" && (
                                        <div className="rounded-lg border border-border p-3 space-y-3 mb-3 bg-secondary/20">
                                            <p className="text-sm font-medium">Adicionar item manual</p>

                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
                                                <Input
                                                    placeholder="Ex: Mão de obra"
                                                    value={form.manualDesc}
                                                    onChange={(e) => set({ manualDesc: e.target.value })}
                                                    className="h-9"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground mb-1 block">Preço unitário</label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="R$ 0,00"
                                                        value={formatCentsToBRL(form.manualPrice)}
                                                        onChange={(e) =>
                                                            set({
                                                                manualPrice: onlyDigits(e.target.value)
                                                                    .replace(/^0+(?=\d)/, "")
                                                                    .slice(0, 12),
                                                            })
                                                        }
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground mb-1 block">Quantidade</label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={form.manualQty}
                                                        onChange={(e) => set({ manualQty: e.target.value })}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <Button type="button" variant="outline" size="sm" onClick={cancelAdding}>
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={confirmAddManualItem}
                                                    disabled={!form.manualDesc.trim() || !form.manualPrice}
                                                >
                                                    Adicionar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Botões de adicionar */}
                                    {form.addingMode === "none" && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={openAddCatalog}
                                                className="flex-1"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Do catálogo
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={openAddManual}
                                                className="flex-1"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                                Item manual
                                            </Button>
                                        </div>
                                    )}
                                </Field>

                                {/* Total preview */}
                                {form.items.length > 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40">
                                        <span className="text-sm text-muted-foreground">Total estimado</span>
                                        <span className="font-semibold tabular-nums">{brlFormatter.format(totalPreview)}</span>
                                    </div>
                                )}

                                {submitError && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {submitError}
                                    </p>
                                )}
                            </FieldGroup>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-4">
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
                                {isSubmitting ? "Abrindo..." : "Abrir Comanda"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState, useEffect, type FormEvent } from "react"
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
import { restockProduct } from "@/services/productService"
import type { Product } from "@/types/productTypes"

type RestockProdutoModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    produto: Product | null
    onSaved: () => void
}

const getServerMessage = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    return typeof message === "string" ? message.trim() : ""
}

export const RestockProdutoModal = ({ open, onOpenChange, produto, onSaved }: RestockProdutoModalProps) => {
    const [quantity, setQuantity] = useState("")
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setQuantity("")
            setReason("")
            setSubmitError(null)
        }
    }, [open])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!produto) return

        const qty = parseInt(quantity, 10)
        if (!Number.isInteger(qty) || qty < 0) {
            setSubmitError("Informe um valor de estoque válido (número inteiro maior ou igual a zero).")
            return
        }

        setSubmitError(null)
        setIsSubmitting(true)

        try {
            await restockProduct(produto.id, {
                quantity: qty,
                ...(reason.trim() ? { reason: reason.trim() } : {})
            })
            onSaved()
            onOpenChange(false)
        } catch (err: unknown) {
            const msg = getServerMessage(err) || "Não foi possível reabastecer. Tente novamente."
            setSubmitError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (isSubmitting) return
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose() }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Atualizar estoque</DialogTitle>
                    <DialogDescription>
                        {produto ? (
                            <>
                                <span className="font-medium text-foreground">{produto.name}</span>
                                {" — "}estoque atual: <span className="font-medium text-foreground">{produto.stock}</span>
                            </>
                        ) : "Digite o novo valor de estoque para o produto."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <FieldGroup className="py-4">
                        <Field>
                            <FieldLabel htmlFor="restock-quantity">Novo estoque</FieldLabel>
                            <Input
                                id="restock-quantity"
                                type="number"
                                inputMode="numeric"
                                min={0}
                                placeholder="Ex: 50"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                className="h-10"
                                autoFocus
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="restock-reason">
                                Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
                            </FieldLabel>
                            <Input
                                id="restock-reason"
                                type="text"
                                placeholder="Ex: Compra do fornecedor"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
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
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

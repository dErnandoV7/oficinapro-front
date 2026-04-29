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
import { type Product, type ProductFormData, type ItemType } from "@/types/productTypes"

type NovoProdutoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ProductFormData) => Promise<void>
  produtoParaEditar?: Product | null
}

type FormState = {
  type: ItemType
  name: string
  description: string
  category: string
  costPrice: string
  sellPrice: string
  stock: string
  minStock: string
}

const createInitialFormData = (): FormState => ({
  type: "PRODUCT",
  name: "",
  description: "",
  category: "",
  costPrice: "",
  sellPrice: "",
  stock: "0",
  minStock: "0",
})

const onlyDigits = (value: string) => value.replace(/\D/g, "")

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

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

export const NovoProdutoModal = ({
  open,
  onOpenChange,
  onSave,
  produtoParaEditar,
}: NovoProdutoModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>(createInitialFormData)

  const isService = formData.type === "SERVICE"

  const resetForm = () => setFormData(createInitialFormData())

  useEffect(() => {
    setSubmitError(null)

    if (produtoParaEditar) {
      const costCents = Math.round(produtoParaEditar.costPrice * 100)
      const sellCents = Math.round(produtoParaEditar.sellPrice * 100)

      setFormData({
        type: produtoParaEditar.type,
        name: produtoParaEditar.name,
        description: produtoParaEditar.description ?? "",
        category: produtoParaEditar.category ?? "",
        costPrice: costCents > 0 ? String(costCents) : "",
        sellPrice: sellCents > 0 ? String(sellCents) : "",
        stock: String(produtoParaEditar.stock),
        minStock: String(produtoParaEditar.minStock),
      })
      return
    }

    resetForm()
  }, [produtoParaEditar, open])

  const handleTypeChange = (type: ItemType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      ...(type === "SERVICE" ? { costPrice: "", stock: "0", minStock: "0" } : {}),
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await onSave({
        type: formData.type,
        name: formData.name,
        ...(formData.description ? { description: formData.description } : {}),
        ...(formData.category ? { category: formData.category } : {}),
        costPrice: isService ? 0 : Number(onlyDigits(formData.costPrice)) / 100,
        sellPrice: Number(onlyDigits(formData.sellPrice)) / 100,
        stock: isService ? 0 : Number(formData.stock),
        minStock: isService ? 0 : Number(formData.minStock),
      })

      resetForm()
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = getServerMessage(err) || "Não foi possível salvar. Tente novamente."
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitError(null)
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose()
          return
        }
        onOpenChange(true)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{produtoParaEditar ? "Editar item" : "Novo item"}</DialogTitle>
          <DialogDescription>
            {produtoParaEditar
              ? "Atualize os dados do produto ou serviço"
              : "Preencha os dados para cadastrar um produto ou serviço"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <div className="flex gap-2">
                {(["PRODUCT", "SERVICE"] as ItemType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
                      formData.type === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-background hover:bg-secondary"
                    }`}
                  >
                    {t === "PRODUCT" ? "Produto" : "Serviço"}
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                placeholder={isService ? "Nome do serviço" : "Nome do produto"}
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="h-10"
                minLength={1}
              />
            </Field>

            {isService ? (
              <Field>
                <FieldLabel htmlFor="sellPrice">Valor do serviço</FieldLabel>
                <Input
                  id="sellPrice"
                  type="text"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={formatCentsToBRL(formData.sellPrice)}
                  onChange={(e) => {
                    const digits = onlyDigits(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12)
                    setFormData((prev) => ({ ...prev, sellPrice: digits }))
                  }}
                  required
                  className="h-10"
                  autoComplete="off"
                />
              </Field>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="costPrice">Preço de custo</FieldLabel>
                    <Input
                      id="costPrice"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={formatCentsToBRL(formData.costPrice)}
                      onChange={(e) => {
                        const digits = onlyDigits(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12)
                        setFormData((prev) => ({ ...prev, costPrice: digits }))
                      }}
                      required
                      className="h-10"
                      autoComplete="off"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sellPrice">Preço de venda</FieldLabel>
                    <Input
                      id="sellPrice"
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={formatCentsToBRL(formData.sellPrice)}
                      onChange={(e) => {
                        const digits = onlyDigits(e.target.value).replace(/^0+(?=\d)/, "").slice(0, 12)
                        setFormData((prev) => ({ ...prev, sellPrice: digits }))
                      }}
                      required
                      className="h-10"
                      autoComplete="off"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="stock">Estoque atual</FieldLabel>
                    <Input
                      id="stock"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock: e.target.value }))}
                      required
                      className="h-10"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="minStock">Estoque mínimo</FieldLabel>
                    <Input
                      id="minStock"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      value={formData.minStock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minStock: e.target.value }))}
                      required
                      className="h-10"
                    />
                  </Field>
                </div>
              </>
            )}

            <Field>
              <FieldLabel htmlFor="category">
                Categoria <span className="text-muted-foreground font-normal">(opcional)</span>
              </FieldLabel>
              <Input
                id="category"
                placeholder={isService ? "Ex: Manutenção, Consultoria..." : "Ex: Ferramentas, Elétrico..."}
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="h-10"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">
                Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
              </FieldLabel>
              <Input
                id="description"
                placeholder={isService ? "Descrição do serviço" : "Descrição do produto"}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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

export type Cliente = {
  id: string
  nome: string
  telefone: string
  endereco: string
  limiteCredito: number
  status: "Ativo" | "Inativo"
}

type ClienteForm = {
  nome: string
  telefone: string
  endereco: string
  limiteCredito?: number
}

type NovoClienteModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (cliente: ClienteForm) => Promise<void>
  clienteParaEditar?: Cliente | null
}

const onlyDigits = (value: string) => value.replace(/\D/g, "")

const formatPhoneBR = (digits: string) => {
  const d = onlyDigits(digits).slice(0, 11)
  if (!d) return ""

  const dd = d.slice(0, 2)
  const rest = d.slice(2)

  if (d.length <= 2) return `(${dd}`

  if (rest.length <= 4) return `(${dd}) ${rest}`

  if (rest.length >= 9) {
    const part1 = rest.slice(0, 5)
    const part2 = rest.slice(5, 9)
    return `(${dd}) ${part1}${part2 ? `-${part2}` : ""}`
  }

  const part1 = rest.slice(0, 4)
  const part2 = rest.slice(4, 8)
  return `(${dd}) ${part1}${part2 ? `-${part2}` : ""}`
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const formatCentsToBRL = (centsDigits: string) => {
  const digits = onlyDigits(centsDigits)
  if (!digits) return ""

  const cents = Number(digits)
  if (!Number.isFinite(cents)) return ""

  return brlFormatter.format(cents / 100)
}

export const NovoClienteModal = ({
  open,
  onOpenChange,
  onSave,
  clienteParaEditar,
}: NovoClienteModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    limiteCredito: "",
  })

  useEffect(() => {
    setSubmitError(null)

    if (clienteParaEditar) {
      const telefoneDigits = onlyDigits(clienteParaEditar.telefone ?? "").slice(0, 11)
      const cents = Number.isFinite(clienteParaEditar.limiteCredito)
        ? Math.round((clienteParaEditar.limiteCredito ?? 0) * 100)
        : 0

      setFormData({
        nome: clienteParaEditar.nome,
        telefone: telefoneDigits,
        endereco: clienteParaEditar.endereco,
        limiteCredito: cents > 0 ? String(cents) : "",
      })
      return
    }

    setFormData({
      nome: "",
      telefone: "",
      endereco: "",
      limiteCredito: "",
    })
  }, [clienteParaEditar, open])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await onSave({
        nome: formData.nome,
        telefone: formData.telefone,
        endereco: formData.endereco,
        limiteCredito: formData.limiteCredito
          ? Number(onlyDigits(formData.limiteCredito)) / 100
          : undefined,
      })

      setFormData({ nome: "", telefone: "", endereco: "", limiteCredito: "" })
      onOpenChange(false)
    } catch (err: unknown) {
      const serverMessage =
        typeof (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message ===
        "string"
          ? ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "")
          : ""

      setSubmitError(
        serverMessage.trim() || "Não foi possível salvar o cliente. Tente novamente.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitError(null)
    setFormData({ nome: "", telefone: "", endereco: "", limiteCredito: "" })
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{clienteParaEditar ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            {clienteParaEditar ? "Atualize os dados do cliente" : "Preencha os dados para cadastrar um novo cliente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="nome">Nome</FieldLabel>
              <Input
                id="nome"
                placeholder="Nome do cliente"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="h-10"
                minLength={3}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="telefone">
                Telefone <span className="text-muted-foreground font-normal">(opcional)</span>
              </FieldLabel>
              <Input
                id="telefone"
                type="tel"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={formatPhoneBR(formData.telefone)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefone: onlyDigits(e.target.value).slice(0, 11),
                  })
                }
                className="h-10"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="endereco">Endereço</FieldLabel>
              <Input
                id="endereco"
                placeholder="Endereço completo"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                required
                className="h-10"
                minLength={5}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="limiteCredito">
                Limite de crédito <span className="text-muted-foreground font-normal">(opcional)</span>
              </FieldLabel>
              <Input
                id="limiteCredito"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={formatCentsToBRL(formData.limiteCredito)}
                onChange={(e) => {
                  const digits = onlyDigits(e.target.value)
                    .replace(/^0+(?=\d)/, "")
                    .slice(0, 12)

                  setFormData({
                    ...formData,
                    limiteCredito: digits,
                  })
                }}
                className="h-10"
                autoComplete="off"
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

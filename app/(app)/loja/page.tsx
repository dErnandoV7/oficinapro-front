"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { toast } from "@/hooks/use-toast"
import { createStore } from "@/services/storeService"

const getServerMessage = (err: unknown) => {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === "string" ? message.trim() : ""
}

const LojaPage = () => {
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const res = await createStore({ name })

      const token = res?.data?.token
      if (token) {
        sessionStorage.setItem("token", token)

        const secure = window.location.protocol === "https:" ? "; secure" : ""
        document.cookie = `token=${encodeURIComponent(token)}; path=/; samesite=lax${secure}`
      }

      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Loja criada com sucesso!",
      })

      router.replace("/dashboard")
    } catch (err: unknown) {
      const msg = getServerMessage(err) || "Não foi possível criar sua loja. Tente novamente."
      setSubmitError(msg)

      toast({
        variant: "destructive",
        title: "Erro",
        description: msg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Criar loja</CardTitle>
          <CardDescription>
            Para acessar o painel, você precisa cadastrar sua loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="storeName">Nome da loja</FieldLabel>
                <Input
                  id="storeName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Oficina do João"
                  minLength={3}
                  required
                />
              </Field>
            </FieldGroup>

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Criando..." : "Adicionar loja"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LojaPage

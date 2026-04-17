"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Wrench, Eye, EyeOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { createUser } from "@/services/userService"
import type { CreateUserType } from "@/types/userTypes"

const INITIAL_FORM_DATA: CreateUserType = {
  name: "",
  email: "",
  phone: "",
  password: "",
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

const getServerMessage = (err: unknown) => {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === "string" ? message.trim() : ""
}

export default function CadastroPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserType>(INITIAL_FORM_DATA)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const res = await createUser(formData)
      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Conta criada com sucesso!",
      })
      setFormData(INITIAL_FORM_DATA)

      router.push("/login")
    } catch (err: unknown) {
      const msg = getServerMessage(err) || "Não foi possível criar sua conta. Tente novamente."
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">OficinaPRO</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold">Criar conta</CardTitle>
            <CardDescription className="text-muted-foreground">
              Crie sua conta para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="nome">Nome</FieldLabel>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="h-11"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="h-11"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
                  <Input
                    id="telefone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                    value={formatPhoneBR(formData.phone)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: onlyDigits(e.target.value).slice(0, 11),
                      }))
                    }
                    required
                    className="h-11"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="senha">Senha</FieldLabel>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </Field>
              </FieldGroup>

              {submitError && (
                <p className="text-sm text-destructive" role="alert">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {isSubmitting ? "Criando..." : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-muted-foreground">Já tem conta? </span>
              <Link href="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

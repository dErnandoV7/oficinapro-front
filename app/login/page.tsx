"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Wrench, Eye, EyeOff } from "lucide-react"
import { loginUser } from "@/services/userService"
import { toast } from "@/hooks/use-toast"
import { tokenHasStore } from "@/lib/jwt"
import { LoginUserType } from "@/types/userTypes"
import { useRouter } from "next/navigation"


const LoginPage = () => {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginUserType>({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const res = await loginUser(formData)

      const token = res?.data?.token
      if (token) {
        sessionStorage.setItem("token", token)

        const secure = window.location.protocol === "https:" ? "; secure" : ""
        document.cookie = `token=${encodeURIComponent(token)}; path=/; samesite=lax${secure}`
      }

      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Login realizado com sucesso!",
      })
      setFormData({ email: "", password: "" })

      const nextPath = token && tokenHasStore(token) ? "/clientes" : "/loja"
      router.push(nextPath)
    } catch (err: unknown) {
      const serverMessage =
        typeof (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message ===
        "string"
          ? ((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "")
          : ""

      setSubmitError(
        serverMessage.trim() || "Não foi possível criar sua conta. Tente novamente.",
      )
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
            <CardTitle className="text-2xl font-semibold">Entrar</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesse sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-muted-foreground">Não tem conta? </span>
              <Link href="/cadastro" className="text-primary font-medium hover:underline">
                Criar conta
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage

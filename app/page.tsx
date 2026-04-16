import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Users, LogIn, UserPlus } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">OficinaPRO</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Gerencie sua oficina com eficiência
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Sistema completo para controle de clientes, serviços e finanças da sua oficina mecânica.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>
                Cadastre-se para começar a usar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/20 mb-2">
                <LogIn className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Já tem uma conta? Faça login aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

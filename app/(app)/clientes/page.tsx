"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { NovoClienteModal, type Cliente } from "@/components/clientes/novo-cliente-modal"
import { PerfilClienteModal } from "@/components/clientes/perfil-cliente-modal"
import { ConfirmarExclusaoModal } from "@/components/clientes/confirmar-exclusao-modal"
import { toast } from "@/hooks/use-toast"
import { createClient, deleteClient, listClients, updateClient } from "@/services/clientService"
import type { Client } from "@/types/clientTypes"

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const toClienteUi = (client: Client): Cliente => ({
  id: client.id,
  nome: client.name,
  telefone: client.phone ?? "",
  endereco: client.address,
  limiteCredito: Number(client.creditLimit ?? 0),
  status: client.isActive ? "Ativo" : "Inativo",
})

const getServerMessage = (err: unknown) => {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === "string" ? message.trim() : ""
}

type ClienteFormData = {
  nome: string
  telefone: string
  endereco: string
  limiteCredito?: number
}

const toClientPayload = (dados: ClienteFormData) => ({
  name: dados.nome,
  phone: dados.telefone,
  address: dados.endereco,
  ...(typeof dados.limiteCredito === "number" ? { creditLimit: dados.limiteCredito } : {}),
})

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalNovoCliente, setModalNovoCliente] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalExclusao, setModalExclusao] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadClientes = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const res = await listClients()
      if (!isMountedRef.current) return
      setClientes(res.data.map(toClienteUi))
    } catch (err: unknown) {
      if (!isMountedRef.current) return

      const serverMessage = getServerMessage(err)
      setLoadError(serverMessage || "Não foi possível carregar os clientes. Tente novamente.")
      setClientes([])
    } finally {
      if (!isMountedRef.current) return
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientes().catch(() => undefined)
  }, [])

  const handleSalvarCliente = async (dados: ClienteFormData) => {
    const payload = toClientPayload(dados)

    if (modoEdicao && clienteSelecionado) {
      const res = await updateClient(clienteSelecionado.id, payload)
      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Cliente atualizado com sucesso!",
      })
      loadClientes().catch(() => undefined)
      return
    }

    const res = await createClient(payload)
    toast({
      variant: "success",
      title: "Sucesso",
      description: res?.message ?? "Cliente criado com sucesso!",
    })
    loadClientes().catch(() => undefined)
  }

  const handleVerCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setModalPerfil(true)
  }

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setModoEdicao(true)
    setModalNovoCliente(true)
  }

  const handleExcluirCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setModalExclusao(true)
  }

  const confirmarExclusao = async () => {
    if (!clienteSelecionado) return

    try {
      const res = await deleteClient(clienteSelecionado.id)
      setModalExclusao(false)
      setModalPerfil(false)
      setClienteSelecionado(null)

      loadClientes().catch(() => undefined)

      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Cliente removido com sucesso!",
      })
    } catch (err: unknown) {
      const serverMessage = getServerMessage(err)

      toast({
        variant: "destructive",
        title: "Erro",
        description:
          serverMessage.trim() || "Não foi possível excluir o cliente. Tente novamente.",
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Clientes</CardTitle>
                <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  loadClientes().catch(() => undefined)
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Recarregar
              </Button>

              <Button
                onClick={() => {
                  setModoEdicao(false)
                  setClienteSelecionado(null)
                  setModalNovoCliente(true)
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="md:hidden">
            {isLoading ? (
              <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                Carregando...
              </div>
            ) : loadError ? (
              <div className="rounded-lg border border-border py-10 text-center text-destructive">
                {loadError}
              </div>
            ) : clientes.length === 0 ? (
              <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                Nenhum cliente cadastrado
              </div>
            ) : (
              <div className="rounded-lg border border-border divide-y divide-border">
                {clientes.map((cliente) => (
                  <div key={cliente.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium leading-5 truncate">{cliente.nome}</p>
                        <Badge
                          variant={cliente.status === "Ativo" ? "default" : "secondary"}
                          className={
                            "shrink-0 " +
                            (cliente.status === "Ativo" ? "bg-green-600 hover:bg-green-600" : "")
                          }
                        >
                          {cliente.status}
                        </Badge>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p className="truncate">{cliente.telefone || "—"}</p>
                        <p className="truncate">{cliente.endereco}</p>
                        <p className="font-medium text-foreground tabular-nums">
                          {cliente.limiteCredito > 0
                            ? brlFormatter.format(cliente.limiteCredito)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVerCliente(cliente)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditarCliente(cliente)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExcluirCliente(cliente)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="font-semibold pl-4">Nome</TableHead>
                  <TableHead className="font-semibold w-40">Telefone</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Endereço</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell text-right w-32">
                    Limite
                  </TableHead>
                  <TableHead className="font-semibold text-center w-24">Status</TableHead>
                  <TableHead className="font-semibold text-right w-20 pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : loadError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-destructive">
                      {loadError}
                    </TableCell>
                  </TableRow>
                ) : clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-secondary/30">
                      <TableCell className="font-medium pl-4">{cliente.nome}</TableCell>
                      <TableCell className="text-muted-foreground w-40">
                        {cliente.telefone || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground max-w-105 truncate">
                        {cliente.endereco}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-medium tabular-nums w-32">
                        {cliente.limiteCredito > 0 ? brlFormatter.format(cliente.limiteCredito) : "—"}
                      </TableCell>
                      <TableCell className="text-center w-24">
                        <Badge
                          variant={cliente.status === "Ativo" ? "default" : "secondary"}
                          className={cliente.status === "Ativo" ? "bg-green-600 hover:bg-green-600" : ""}
                        >
                          {cliente.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 w-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVerCliente(cliente)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditarCliente(cliente)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExcluirCliente(cliente)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoClienteModal
        open={modalNovoCliente}
        onOpenChange={(open) => {
          setModalNovoCliente(open)
          if (!open) {
            setModoEdicao(false)
            setClienteSelecionado(null)
          }
        }}
        onSave={handleSalvarCliente}
        clienteParaEditar={modoEdicao ? clienteSelecionado : null}
      />

      <PerfilClienteModal
        open={modalPerfil}
        onOpenChange={setModalPerfil}
        cliente={clienteSelecionado}
        onExcluir={(id) => {
          const cliente = clientes.find((c) => c.id === id)
          if (cliente) {
            setClienteSelecionado(cliente)
            setModalExclusao(true)
          }
        }}
      />

      <ConfirmarExclusaoModal
        open={modalExclusao}
        onOpenChange={setModalExclusao}
        nomeCliente={clienteSelecionado?.nome || ""}
        onConfirmar={() => {
          confirmarExclusao().catch(() => undefined)
        }}
      />
    </div>
  )
}

export default ClientesPage

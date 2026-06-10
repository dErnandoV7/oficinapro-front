"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Power,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react"
import { NovoClienteModal, type Cliente } from "@/components/clientes/novo-cliente-modal"
import { PerfilClienteModal } from "@/components/clientes/perfil-cliente-modal"
import { ConfirmarExclusaoModal } from "@/components/clientes/confirmar-exclusao-modal"
import { ConfirmarStatusModal } from "@/components/clientes/confirmar-status-modal"
import { toast } from "@/hooks/use-toast"
import { createClient, deleteClient, listClients, updateClient } from "@/services/clientService"
import { formatPhone } from "@/lib/utils"
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

type ClientFilters = {
  q?: string
  isActive?: string
  sort?: string
}

const buildServiceParams = (filters: ClientFilters) => {
  const [sortBy, order] = filters.sort ? filters.sort.split("-") : []
  return {
    ...(filters.q && { q: filters.q }),
    ...(filters.isActive && { isActive: filters.isActive as "true" | "false" }),
    ...(sortBy && {
      sortBy: sortBy as "creditLimit",
      order: order as "asc" | "desc",
    }),
  }
}

const ClientesPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState("")
  const [filterIsActive, setFilterIsActive] = useState("")
  const [filterSort, setFilterSort] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalNovoCliente, setModalNovoCliente] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [modalExclusao, setModalExclusao] = useState(false)
  const [modalStatus, setModalStatus] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteParaStatus, setClienteParaStatus] = useState<Cliente | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const loadClientes = async (filters: ClientFilters) => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const res = await listClients(buildServiceParams(filters))
      if (!isMountedRef.current) return
      setClientes(res.data.map(toClienteUi))
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const serverMessage = getServerMessage(err)
      setLoadError(serverMessage || "Não foi possível carregar os clientes. Tente novamente.")
      setClientes([])
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientes({}).catch(() => undefined)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadClientes({
        q: busca || undefined,
        isActive: filterIsActive || undefined,
        sort: filterSort || undefined,
      }).catch(() => undefined)
    }, 400)
    return () => clearTimeout(timeout)
  }, [busca, filterIsActive, filterSort])

  const reloadWithCurrentFilters = () =>
    loadClientes({
      q: busca || undefined,
      isActive: filterIsActive || undefined,
      sort: filterSort || undefined,
    }).catch(() => undefined)

  const handleSalvarCliente = async (dados: ClienteFormData) => {
    const payload = toClientPayload(dados)

    if (modoEdicao && clienteSelecionado) {
      const res = await updateClient(clienteSelecionado.id, payload)
      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? "Cliente atualizado com sucesso!",
      })
      reloadWithCurrentFilters()
      return
    }

    const res = await createClient(payload)
    toast({
      variant: "success",
      title: "Sucesso",
      description: res?.message ?? "Cliente criado com sucesso!",
    })
    reloadWithCurrentFilters()
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

  const handleToggleAtivo = (cliente: Cliente) => {
    setClienteParaStatus(cliente)
    setModalStatus(true)
  }

  const confirmarToggleStatus = async () => {
    if (!clienteParaStatus) return

    const novoStatus = clienteParaStatus.status !== "Ativo"

    try {
      const res = await updateClient(clienteParaStatus.id, { isActive: novoStatus })
      toast({
        variant: "success",
        title: "Sucesso",
        description: res?.message ?? (novoStatus ? "Cliente ativado com sucesso!" : "Cliente desativado com sucesso!"),
      })
      reloadWithCurrentFilters()
    } catch (err: unknown) {
      const serverMessage = getServerMessage(err)
      toast({
        variant: "destructive",
        title: "Erro",
        description: serverMessage || "Não foi possível atualizar o status do cliente.",
      })
    } finally {
      setClienteParaStatus(null)
    }
  }

  const confirmarExclusao = async () => {
    if (!clienteSelecionado) return

    try {
      const res = await deleteClient(clienteSelecionado.id)
      setModalExclusao(false)
      setModalPerfil(false)
      setClienteSelecionado(null)

      reloadWithCurrentFilters()

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
                onClick={reloadWithCurrentFilters}
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
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <Select value={filterIsActive || "all"} onValueChange={(v) => setFilterIsActive(v === "all" ? "" : v)}>
                <SelectTrigger className="h-10 w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Ordenar por</span>
              <Select value={filterSort || "default"} onValueChange={(v) => setFilterSort(v === "default" ? "" : v)}>
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="creditLimit-desc">Maior crédito</SelectItem>
                  <SelectItem value="creditLimit-asc">Menor crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                Nenhum cliente encontrado
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
                        <p className="truncate">{formatPhone(cliente.telefone) || "—"}</p>
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
                        <DropdownMenuItem onClick={() => handleToggleAtivo(cliente)}>
                          <Power className="w-4 h-4 mr-2" />
                          {cliente.status === "Ativo" ? "Desativar" : "Ativar"}
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
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-secondary/30">
                      <TableCell className="font-medium pl-4">{cliente.nome}</TableCell>
                      <TableCell className="text-muted-foreground w-40">
                        {formatPhone(cliente.telefone) || "—"}
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
                            <DropdownMenuItem onClick={() => handleToggleAtivo(cliente)}>
                              <Power className="w-4 h-4 mr-2" />
                              {cliente.status === "Ativo" ? "Desativar" : "Ativar"}
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

      <ConfirmarStatusModal
        open={modalStatus}
        onOpenChange={(open) => {
          setModalStatus(open)
          if (!open) setClienteParaStatus(null)
        }}
        nomeCliente={clienteParaStatus?.nome || ""}
        ativar={clienteParaStatus?.status !== "Ativo"}
        onConfirmar={() => {
          confirmarToggleStatus().catch(() => undefined)
        }}
      />
    </div>
  )
}

export default ClientesPage

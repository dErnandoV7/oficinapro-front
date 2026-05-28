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
import { Eye, MoreHorizontal, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { NovoProdutoModal } from "@/components/produtos/novo-produto-modal"
import { PerfilProdutoModal } from "@/components/produtos/perfil-produto-modal"
import { ConfirmarExclusaoProdutoModal } from "@/components/produtos/confirmar-exclusao-modal"
import { toast } from "@/hooks/use-toast"
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/services/productService"
import type { Product, ProductFormData } from "@/types/productTypes"

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const getServerMessage = (err: unknown) => {
    const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
    return typeof message === "string" ? message.trim() : ""
}

type ProductFilters = {
    search?: string
    type?: string
    isActive?: string
    sort?: string
}

const buildServiceParams = (filters: ProductFilters) => {
    const [sortBy, order] = filters.sort ? filters.sort.split("-") : []
    return {
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type as "PRODUCT" | "SERVICE" }),
        ...(filters.isActive && { isActive: filters.isActive as "true" | "false" }),
        ...(sortBy && {
            sortBy: sortBy as "sellPrice" | "costPrice" | "stock",
            order: order as "asc" | "desc",
        }),
    }
}

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState("")
    const [filterType, setFilterType] = useState("")
    const [filterIsActive, setFilterIsActive] = useState("")
    const [filterSort, setFilterSort] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [modalNovoProduto, setModalNovoProduto] = useState(false)
    const [modalPerfil, setModalPerfil] = useState(false)
    const [modalExclusao, setModalExclusao] = useState(false)
    const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null)
    const [modoEdicao, setModoEdicao] = useState(false)

    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    const loadProducts = async (filters: ProductFilters) => {
        setIsLoading(true)
        setLoadError(null)

        try {
            const res = await listProducts(buildServiceParams(filters))
            if (!isMountedRef.current) return
            setProducts(res.data)
        } catch (err: unknown) {
            if (!isMountedRef.current) return
            const serverMessage = getServerMessage(err)
            setLoadError(serverMessage || "Não foi possível carregar os itens. Tente novamente.")
            setProducts([])
        } finally {
            if (isMountedRef.current) setIsLoading(false)
        }
    }

    useEffect(() => {
        loadProducts({}).catch(() => undefined)
    }, [])

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadProducts({
                search: search || undefined,
                type: filterType || undefined,
                isActive: filterIsActive || undefined,
                sort: filterSort || undefined,
            }).catch(() => undefined)
        }, 400)
        return () => clearTimeout(timeout)
    }, [search, filterType, filterIsActive, filterSort])

    const reloadWithCurrentFilters = () =>
        loadProducts({
            search: search || undefined,
            type: filterType || undefined,
            isActive: filterIsActive || undefined,
            sort: filterSort || undefined,
        }).catch(() => undefined)

    const handleSalvarProduto = async (dados: ProductFormData) => {
        if (modoEdicao && produtoSelecionado) {
            const res = await updateProduct(produtoSelecionado.id, dados)
            toast({ variant: "success", title: "Sucesso", description: res.message })
        } else {
            const res = await createProduct(dados)
            toast({ variant: "success", title: "Sucesso", description: res.message })
        }
        reloadWithCurrentFilters()
    }

    const handleVerProduto = (produto: Product) => {
        setProdutoSelecionado(produto)
        setModalPerfil(true)
    }

    const handleEditarProduto = (produto: Product) => {
        setProdutoSelecionado(produto)
        setModoEdicao(true)
        setModalNovoProduto(true)
    }

    const handleExcluirProduto = (produto: Product) => {
        setProdutoSelecionado(produto)
        setModalExclusao(true)
    }

    const confirmarExclusao = async () => {
        if (!produtoSelecionado) return

        try {
            const res = await deleteProduct(produtoSelecionado.id)
            setProdutoSelecionado(null)
            reloadWithCurrentFilters()
            toast({ variant: "success", title: "Sucesso", description: res.message })
        } catch (err: unknown) {
            const serverMessage = getServerMessage(err)
            toast({
                variant: "destructive",
                title: "Erro",
                description: serverMessage || "Não foi possível excluir o item. Tente novamente.",
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
                                <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Produtos & Serviços</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {products.length} {products.length === 1 ? "item cadastrado" : "itens cadastrados"}
                                </p>
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
                                    setProdutoSelecionado(null)
                                    setModalNovoProduto(true)
                                }}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Item
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou categoria..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Tipo</span>
                            <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
                                <SelectTrigger className="h-10 w-full sm:w-36">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PRODUCT">Produto</SelectItem>
                                    <SelectItem value="SERVICE">Serviço</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    <SelectItem value="sellPrice-desc">Maior preço</SelectItem>
                                    <SelectItem value="sellPrice-asc">Menor preço</SelectItem>
                                    <SelectItem value="costPrice-desc">Maior custo</SelectItem>
                                    <SelectItem value="costPrice-asc">Menor custo</SelectItem>
                                    <SelectItem value="stock-desc">Mais estoque</SelectItem>
                                    <SelectItem value="stock-asc">Menos estoque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                                Carregando...
                            </div>
                        ) : loadError ? (
                            <div className="rounded-lg border border-border py-10 text-center text-destructive">
                                {loadError}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
                                Nenhum item encontrado
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border divide-y divide-border">
                                {products.map((produto) => (
                                    <div key={produto.id} className="p-4 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="font-medium leading-5 truncate">{produto.name}</p>
                                                <Badge
                                                    variant={produto.isActive ? "default" : "secondary"}
                                                    className={produto.isActive ? "bg-green-600 hover:bg-green-600 shrink-0" : "shrink-0"}
                                                >
                                                    {produto.isActive ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <p>{produto.type === "PRODUCT" ? "Produto" : "Serviço"} {produto.category ? `· ${produto.category}` : ""}</p>
                                                <p className="font-medium text-foreground tabular-nums">
                                                    {brlFormatter.format(produto.sellPrice)}
                                                </p>
                                                <p>Estoque: {produto.stock}</p>
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
                                                <DropdownMenuItem onClick={() => handleVerProduto(produto)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditarProduto(produto)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleExcluirProduto(produto)}
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

                    {/* Desktop */}
                    <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                                    <TableHead className="font-semibold pl-4">Nome</TableHead>
                                    <TableHead className="font-semibold w-28">Tipo</TableHead>
                                    <TableHead className="font-semibold hidden lg:table-cell">Categoria</TableHead>
                                    <TableHead className="font-semibold text-right w-32">Venda</TableHead>
                                    <TableHead className="font-semibold text-right w-32 hidden lg:table-cell">Custo</TableHead>
                                    <TableHead className="font-semibold text-center w-24">Estoque</TableHead>
                                    <TableHead className="font-semibold text-center w-24">Status</TableHead>
                                    <TableHead className="font-semibold text-right w-20 pr-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            Carregando...
                                        </TableCell>
                                    </TableRow>
                                ) : loadError ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-destructive">
                                            {loadError}
                                        </TableCell>
                                    </TableRow>
                                ) : products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            Nenhum item encontrado
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((produto) => (
                                        <TableRow key={produto.id} className="hover:bg-secondary/30">
                                            <TableCell className="font-medium pl-4 truncate">{produto.name}</TableCell>
                                            <TableCell className="w-28">
                                                <Badge variant="outline">
                                                    {produto.type === "PRODUCT" ? "Produto" : "Serviço"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground truncate">
                                                {produto.category || "—"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium tabular-nums w-32">
                                                {brlFormatter.format(produto.sellPrice)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums w-32 hidden lg:table-cell">
                                                {brlFormatter.format(produto.costPrice)}
                                            </TableCell>
                                            <TableCell className="text-center w-24 tabular-nums">
                                                <span className={produto.stock <= produto.minStock ? "text-destructive font-medium" : ""}>
                                                    {produto.stock}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center w-24">
                                                <Badge
                                                    variant={produto.isActive ? "default" : "secondary"}
                                                    className={produto.isActive ? "bg-green-600 hover:bg-green-600" : ""}
                                                >
                                                    {produto.isActive ? "Ativo" : "Inativo"}
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
                                                        <DropdownMenuItem onClick={() => handleVerProduto(produto)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Ver
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditarProduto(produto)}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleExcluirProduto(produto)}
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

            <NovoProdutoModal
                open={modalNovoProduto}
                onOpenChange={(open) => {
                    setModalNovoProduto(open)
                    if (!open) {
                        setModoEdicao(false)
                        setProdutoSelecionado(null)
                    }
                }}
                onSave={handleSalvarProduto}
                produtoParaEditar={modoEdicao ? produtoSelecionado : null}
            />

            <PerfilProdutoModal
                open={modalPerfil}
                onOpenChange={setModalPerfil}
                produto={produtoSelecionado}
                onEditar={(produto) => {
                    handleEditarProduto(produto)
                }}
                onExcluir={(produto) => {
                    handleExcluirProduto(produto)
                }}
            />

            <ConfirmarExclusaoProdutoModal
                open={modalExclusao}
                onOpenChange={setModalExclusao}
                nomeItem={produtoSelecionado?.name ?? ""}
                onConfirmar={() => { confirmarExclusao().catch(() => undefined) }}
            />
        </div>
    )
}

export default ProductsPage

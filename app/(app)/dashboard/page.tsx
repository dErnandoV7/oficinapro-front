"use client"

import { useEffect, useRef, useState } from "react"
import {
    AlertTriangle,
    ClipboardList,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Users,
    LayoutDashboard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getDashboardSummary, type DashboardSummary } from "@/services/dashboardService"

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

type StatCardProps = {
    title: string
    value: string
    icon: React.ReactNode
    iconBg: string
    isLoading: boolean
}

const StatCard = ({ title, value, icon, iconBg, isLoading }: StatCardProps) => (
    <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    {isLoading ? (
                        <div className="mt-1 h-8 w-28 rounded bg-secondary/60 animate-pulse" />
                    ) : (
                        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
                    )}
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </CardContent>
    </Card>
)

const DashboardPage = () => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const isMountedRef = useRef(true)

    useEffect(() => {
        isMountedRef.current = true
        return () => { isMountedRef.current = false }
    }, [])

    const loadSummary = async () => {
        setIsLoading(true)
        setLoadError(null)

        try {
            const res = await getDashboardSummary()
            if (!isMountedRef.current) return
            setSummary(res.data)
        } catch {
            if (!isMountedRef.current) return
            setLoadError("Não foi possível carregar o painel. Tente novamente.")
        } finally {
            if (isMountedRef.current) setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSummary().catch(() => undefined)
    }, [])

    const stats = summary
        ? [
            {
                title: "Total a receber",
                value: brlFormatter.format(summary.totalReceivable),
                icon: <TrendingDown className="w-5 h-5 text-amber-600" />,
                iconBg: "bg-amber-100 dark:bg-amber-900/30",
            },
            {
                title: "Recebido este mês",
                value: brlFormatter.format(summary.totalReceivedThisMonth),
                icon: <TrendingUp className="w-5 h-5 text-green-600" />,
                iconBg: "bg-green-100 dark:bg-green-900/30",
            },
            {
                title: "Clientes com dívida",
                value: String(summary.clientsWithDebt),
                icon: <Users className="w-5 h-5 text-blue-600" />,
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
            },
            {
                title: "Comandas abertas",
                value: String(summary.openSalesCount),
                icon: <ClipboardList className="w-5 h-5 text-primary" />,
                iconBg: "bg-primary/10",
            },
        ]
        : []

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                        <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Painel Geral</h1>
                        <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadSummary().catch(() => undefined)}
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Atualizar
                </Button>
            </div>

            {loadError ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-10 text-center text-destructive">
                        {loadError}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {isLoading || !summary
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <StatCard
                                    key={i}
                                    title="Carregando..."
                                    value="—"
                                    icon={<div className="w-5 h-5" />}
                                    iconBg="bg-secondary"
                                    isLoading
                                />
                            ))
                            : stats.map((stat) => (
                                <StatCard
                                    key={stat.title}
                                    title={stat.title}
                                    value={stat.value}
                                    icon={stat.icon}
                                    iconBg={stat.iconBg}
                                    isLoading={false}
                                />
                            ))}
                    </div>

                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Estoque baixo ou zerado</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Produtos que atingiram ou ultrapassaram o estoque mínimo
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading || !summary ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-16 rounded-lg bg-secondary/60 animate-pulse" />
                                    ))}
                                </div>
                            ) : summary.lowStockItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">
                                    Todos os produtos estão com estoque adequado.
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {summary.lowStockItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-1.5 rounded-lg border border-border bg-secondary/20 px-3 py-2.5"
                                        >
                                            <span className="text-sm font-medium leading-tight line-clamp-2">{item.name}</span>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs text-muted-foreground">mín: {item.minStock}</span>
                                                <Badge
                                                    variant={item.stock === 0 ? "destructive" : "secondary"}
                                                    className={item.stock === 0 ? "text-xs" : "text-xs bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"}
                                                >
                                                    {item.stock === 0 ? "Zerado" : `${item.stock} un.`}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

export default DashboardPage

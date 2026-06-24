import api from "@/api/axios"
import type { ApiResponse } from "@/types/clientTypes"

export type LowStockItem = {
    id: string
    name: string
    stock: number
    minStock: number
}

export type DashboardSummary = {
    totalReceivable: number
    totalReceivedThisMonth: number
    clientsWithDebt: number
    openSalesCount: number
    lowStockItems: LowStockItem[]
}

export const getDashboardSummary = async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>("/dashboard/summary")
    return res.data
}

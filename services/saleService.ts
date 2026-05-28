import api from "@/api/axios"
import type { ApiResponse } from "@/types/clientTypes"
import type { Sale, SaleFormData, ListSalesParams } from "@/types/saleTypes"

export const listSales = async (params?: ListSalesParams) => {
    const res = await api.get<ApiResponse<Sale[]>>("/sales", { params })
    return res.data
}

export const getSale = async (saleId: string) => {
    const res = await api.get<ApiResponse<Sale>>(`/sales/${saleId}`)
    return res.data
}

export const createSale = async (data: SaleFormData) => {
    const res = await api.post<ApiResponse<Sale>>("/sales", data)
    return res.data
}
